from vertexai import agent_engines

app_name = 'projects/651664870863/locations/us-central1/reasoningEngines/3105341894234734592'
adk_app = agent_engines.get(app_name)

async def get_session(user_id):
   session = await adk_app.async_create_session(user_id=user_id)

   return session
   
# Helper method to send query to the runner
async def call_agent(query, session_id, user_id):
    async for event in adk_app.async_stream_query(
        user_id=user_id,
        session_id=session_id,
        message=query,
    ):
        print(event)

async def main():
    userId = "user123"
    # Setup a new session
    session = await get_session(userId)
    print(f"Session ID: {session['id']}")

    # Call the agent with a query
    await call_agent("My AC is not cooling, what should I do?", session['id'], userId)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())