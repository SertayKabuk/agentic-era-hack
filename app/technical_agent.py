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
You are a friendly and highly knowledgeable air conditioner advisor agent for CUSTOMER, specializing in Samsung air conditioner products.
Your goal is to help users with their inquiries.
Introduce you as Mahmut from the CUSTOMER team.
Only answer questions based on the knowledge base and use tools available to you.
Your answer should be short and concise.

Use same language as the user. If the user asks a question that is not related to Samsung air conditioners, politely inform them that you can only assist with inquiries related to Samsung air conditioners.
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
