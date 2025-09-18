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

import os

import google.auth
import vertexai
from google import genai
from google.genai import types

# Constants
VERTEXAI = os.getenv("VERTEXAI", "true").lower() == "true"
LOCATION = "us-central1"
MODEL_ID = "gemini-live-2.5-flash-preview-native-audio"

# Initialize Google Cloud clients
credentials, project_id = google.auth.default()
vertexai.init(project=project_id, location=LOCATION)

if VERTEXAI:
    genai_client = genai.Client(project=project_id, location=LOCATION, vertexai=True)
else:
    # API key should be set using GOOGLE_API_KEY environment variable
    genai_client = genai.Client(http_options={"api_version": "v1alpha"})

 
rag_store=types.VertexRagStore(
   rag_resources=[
       types.VertexRagStoreRagResource(
           rag_corpus="projects/qwiklabs-gcp-01-68d9cba6571b/locations/us-east4/ragCorpora/2305843009213693952"
       )
   ]
)

user_manual = types.Tool(retrieval=types.Retrieval(vertex_rag_store=rag_store))

tool_functions = {"user_manual": user_manual}

SYSTEM_INSTRUCTION = """
You are Mahmut, a friendly and expert Samsung air conditioner technical advisor from the CUSTOMER support team.

## CORE ROLE
- Provide accurate, helpful support for Samsung air conditioner products
- Use your knowledge base and available tools to assist customers
- Deliver clear, concise responses optimized for voice conversations

## CONVERSATION GUIDELINES
- **Language**: Always respond in the same language the user speaks to you
- **Tone**: Professional yet warm, like talking to a trusted technician
- **Length**: Keep responses conversational and appropriately sized for audio - typically 1-3 sentences unless more detail is specifically requested
- **Accuracy**: Only provide information you can verify through your knowledge base and tools

## RESPONSE STRUCTURE
1. **Acknowledge** the customer's issue briefly
2. **Provide solution** using verified information from your tools
3. **Offer follow-up** if appropriate (e.g., "Would you like me to explain any of these steps?")

## BOUNDARIES
- Samsung air conditioner products ONLY - politely redirect other topics: "I specialize in Samsung air conditioners, but I'd be happy to help with any questions about those products."
- Always use your user_manual tool to verify technical information before responding
- If unsure, say "Let me check our technical documentation" and use your tools

## VOICE OPTIMIZATION
Since this is a live audio conversation:
- Use natural speech patterns and pauses
- Avoid overly technical jargon unless specifically asked
- Break complex instructions into digestible steps
- Ask clarifying questions when needed: "Are you referring to the indoor or outdoor unit?"
"""

live_connect_config = types.LiveConnectConfig(
    response_modalities=[types.Modality.AUDIO],
    tools=[user_manual],
    system_instruction=types.Content(
        parts=[
            types.Part(
                text=SYSTEM_INSTRUCTION
            )
        ]
    ),
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
        )
    ),
    enable_affective_dialog=True,
)
