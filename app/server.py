# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import json
import logging
from collections.abc import Callable
from pathlib import Path
from typing import Any, Literal

import backoff
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google.cloud import logging as google_cloud_logging
from google.genai import types
from google.genai.types import LiveServerToolCall
from pydantic import BaseModel
from websockets.exceptions import ConnectionClosedError

# Google ADK imports for proper agent usage
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from app.technical_agent import MODEL_ID, genai_client, live_connect_config, tool_functions
from app.turkish_airlines_text_agent.turkish_airlines_text_agent import root_agent

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the path to the frontend build directory
current_dir = Path(__file__).parent
frontend_build_dir = current_dir.parent / "frontend" / "build"

# Mount static files if build directory exists
if frontend_build_dir.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(frontend_build_dir / "static")),
        name="static",
    )

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Cloud logging client for structured logs
try:
    gcp_logging_client = google_cloud_logging.Client()
    gcp_logger = gcp_logging_client.logger(__name__)
except Exception:
    # Fallback if Google Cloud logging is not available
    gcp_logger = None

# Setup Turkish Airlines agent with proper session management
APP_NAME = "turkish_airlines_app"
session_service = InMemorySessionService()
turkish_airlines_runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


class GeminiSession:
    """Manages bidirectional communication between a client and the Gemini model."""

    def __init__(
        self, session: Any, websocket: WebSocket, tool_functions: dict[str, Callable]
    ) -> None:
        """Initialize the Gemini session.

        Args:
            session: The Gemini session
            websocket: The client websocket connection
            user_id: Unique identifier for this client
            tool_functions: Dictionary of available tool functions
        """
        self.session = session
        self.websocket = websocket
        self.run_id = "n/a"
        self.user_id = "n/a"
        self.tool_functions = tool_functions
        self._tool_tasks: list[asyncio.Task] = []

    async def receive_from_client(self) -> None:
        """Listen for and process messages from the client.

        Continuously receives messages and forwards audio data to Gemini.
        Handles connection errors gracefully.
        """
        while True:
            try:
                data = await self.websocket.receive_json()

                if isinstance(data, dict) and (
                    "realtimeInput" in data or "clientContent" in data
                ):
                    await self.session._ws.send(json.dumps(data))
                elif "setup" in data:
                    self.run_id = data["setup"]["run_id"]
                    self.user_id = data["setup"]["user_id"]
                    # Log setup info to both standard and Google Cloud logging
                    logger.info(f"Setup: {data['setup']}")
                    if gcp_logger:
                        gcp_logger.log_struct(
                            {**data["setup"], "type": "setup"}, severity="INFO"
                        )
                else:
                    logging.warning(f"Received unexpected input from client: {data}")
            except ConnectionClosedError as e:
                logging.warning(f"Client {self.user_id} closed connection: {e}")
                break
            except Exception as e:
                logging.error(f"Error receiving from client {self.user_id}: {e!s}")
                break

    def _get_func(self, action_label: str | None) -> Callable | None:
        """Get the tool function for a given action label."""
        if action_label is None or action_label == "":
            return None
        return self.tool_functions.get(action_label)

    async def _handle_tool_call(
        self, session: Any, tool_call: LiveServerToolCall
    ) -> None:
        """Process tool calls from Gemini and send back responses."""
        if tool_call.function_calls is None:
            logging.debug("No function calls in tool_call")
            return

        for fc in tool_call.function_calls:
            logging.debug(f"Calling tool function: {fc.name} with args: {fc.args}")
            func = self._get_func(fc.name)
            if func is None:
                logging.error(f"Function {fc.name} not found")
                continue
            args = fc.args if fc.args is not None else {}

            # Handle both async and sync functions appropriately
            if asyncio.iscoroutinefunction(func):
                # Function is already async
                response = await func(**args)
            else:
                # Run sync function in a thread pool to avoid blocking
                response = await asyncio.to_thread(func, **args)

            tool_response = types.LiveClientToolResponse(
                function_responses=[
                    types.FunctionResponse(name=fc.name, id=fc.id, response=response)
                ]
            )
            logging.debug(f"Tool response: {tool_response}")
            await session.send(input=tool_response)

    async def receive_from_gemini(self) -> None:
        """Listen for and process messages from Gemini without blocking."""
        while result := await self.session._ws.recv(decode=False):
            await self.websocket.send_bytes(result)
            raw_message = json.loads(result)
            if "toolCall" in raw_message:
                message = types.LiveServerMessage.model_validate(raw_message)
                tool_call = LiveServerToolCall.model_validate(message.tool_call)
                # Create a separate task to handle the tool call without blocking
                task = asyncio.create_task(
                    self._handle_tool_call(self.session, tool_call)
                )
                self._tool_tasks.append(task)

     
def get_connect_and_run_callable(websocket: WebSocket) -> Callable:
    """Create a callable that handles Gemini connection with retry logic.

    Args:
        websocket: The client websocket connection

    Returns:
        Callable: An async function that establishes and manages the Gemini connection
    """

    async def on_backoff(details: backoff._typing.Details) -> None:
        await websocket.send_json(
            {
                "status": f"Model connection error, retrying in {details['wait']} seconds..."
            }
        )

    @backoff.on_exception(
        backoff.expo, ConnectionClosedError, max_tries=10, on_backoff=on_backoff
    )
    async def connect_and_run() -> None:
        async with genai_client.aio.live.connect(
            model=MODEL_ID, config=live_connect_config
        ) as session:
            await websocket.send_json({"status": "Backend is ready for conversation"})
            gemini_session = GeminiSession(
                session=session, websocket=websocket, tool_functions=tool_functions
            )
            logging.info("Starting bidirectional communication")
            await asyncio.gather(
                gemini_session.receive_from_client(),
                gemini_session.receive_from_gemini(),
            )

    return connect_and_run


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Handle new websocket connections."""
    await websocket.accept()
    connect_and_run = get_connect_and_run_callable(websocket)
    await connect_and_run()


class Feedback(BaseModel):
    """Represents feedback for a conversation."""

    score: int | float
    text: str | None = ""
    run_id: str
    user_id: str | None
    log_type: Literal["feedback"] = "feedback"


@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log feedback.

    Args:
        feedback: The feedback data to log

    Returns:
        Success message
    """
    # Log to standard logging
    logger.info(f"Feedback received: {feedback.model_dump()}")
    # Log to Google Cloud logging if available
    if gcp_logger:
        gcp_logger.log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


class ChatMessage(BaseModel):
    """Represents a chat message."""
    message: str
    user_id: str | None = None


@app.post("/api/turkish-airlines/chat")
async def turkish_airlines_chat(chat_message: ChatMessage) -> dict[str, str]:
    """Handle chat requests to Turkish Airlines agent.
    
    Args:
        chat_message: The chat message data
        
    Returns:
        Response from the Turkish Airlines agent
    """
    try:
        # Create or get session for the user
        user_id = chat_message.user_id or "default_user"
        session_id = f"session_{user_id}"
        
        # Ensure session exists (async)
        try:
            session = await session_service.get_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
            if session is None:
                session = await session_service.create_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
        except Exception:
            # If get_session fails, create a new one
            session = await session_service.create_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
        
        # Create content from user message
        content = types.Content(role='user', parts=[types.Part(text=chat_message.message)])
        
        # Run the agent using async method
        events = []
        async for event in turkish_airlines_runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
            events.append(event)
        
        response_text = ""
        for event in events:
            if event.is_final_response() and event.content:
                # Extract text from all parts
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        response_text += part.text
        
        return {
            "status": "success",
            "response": response_text if response_text else "No response from agent",
            "user_id": chat_message.user_id
        }
    except Exception as e:
        # Log error using standard logging
        logger.error(f"Error in Turkish Airlines chat: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "user_id": chat_message.user_id
        }


@app.get("/")
async def serve_frontend_root() -> FileResponse:
    """Serve the frontend index.html at the root path."""
    index_file = frontend_build_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(
        status_code=404,
        detail="Frontend not built. Run 'npm run build' in the frontend directory.",
    )


@app.get("/{full_path:path}")
async def serve_frontend_spa(full_path: str) -> FileResponse:
    """Catch-all route to serve the frontend for SPA routing.

    This ensures that client-side routes are handled by the React app.
    Excludes API routes (ws, feedback) and static assets.
    """
    # Don't intercept API routes
    if full_path.startswith(("ws", "feedback", "static", "api")):
        raise HTTPException(status_code=404, detail="Not found")

    # Serve index.html for all other routes (SPA routing)
    index_file = frontend_build_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(
        status_code=404,
        detail="Frontend not built. Run 'npm run build' in the frontend directory.",
    )


# Main execution
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.server:app", host="0.0.0.0", port=8000)
