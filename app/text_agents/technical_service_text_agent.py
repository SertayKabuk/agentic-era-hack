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
from google.adk.agents import Agent

_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

from google.adk.tools.retrieval.vertex_ai_rag_retrieval import VertexAiRagRetrieval
from vertexai.preview import rag

ask_vertex_retrieval = VertexAiRagRetrieval(
    name="retrieve_rag_documentation",
    description=(
        "Use this tool to retrieve documentation and reference materials for samsung air conditioner related questions,"
    ),
    rag_resources=[
        rag.RagResource(
            # please fill in your own rag corpus
            # here is a sample rag corpus for testing purpose
            # e.g. projects/123/locations/us-central1/ragCorpora/456
            rag_corpus="projects/qwiklabs-gcp-01-68d9cba6571b/locations/us-east4/ragCorpora/2305843009213693952"
        )
    ],
    similarity_top_k=10,
    vector_distance_threshold=0.6,
)

SYSTEM_INSTRUCTION = """
You are a friendly and highly knowledgeable air conditioner advisor agent for CUSTOMER, specializing in Samsung air conditioner products. Your goal is to help users with their inquiries.
Introduce you as Mahmut from the CUSTOMER team.
When a user asks a question about air conditioners, you MUST use the `retrieve_rag_documentation` tool to find the relevant information from the knowledge base.
Only answer questions based on this knowledge base.

Speak Turkish.
"""

technical_service_text_agent = Agent(
    name="technical_service_text_agent",
    model="gemini-2.5-flash",
    instruction=SYSTEM_INSTRUCTION,
    tools=[ask_vertex_retrieval],
)
