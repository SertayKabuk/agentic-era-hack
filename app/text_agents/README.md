# Technical Service Text Agent - Google Agent Engine Deployment Guide

This guide explains how to deploy and use the Technical Service Text Agent with Google Agent Engine on Vertex AI.

## Overview

The Technical Service Text Agent is a specialized AI assistant designed to help users with Samsung air conditioner inquiries. It uses Google's Agent Development Kit (ADK) and Vertex AI RAG (Retrieval Augmented Generation) to provide accurate, knowledge-based responses.

### Features

- **Specialized Knowledge**: Trained on Samsung air conditioner documentation
- **RAG Integration**: Uses Vertex AI RAG for retrieving relevant documentation
- **Turkish Language Support**: Responds in Turkish
- **Cloud Logging & Tracing**: Built-in monitoring and observability
- **Feedback Collection**: Allows for user feedback collection and logging

## Prerequisites

Before deploying the agent, ensure you have:

1. **Google Cloud Project** with the following APIs enabled:
   - Vertex AI API
   - Cloud Logging API
   - Cloud Storage API
   - Agent Engine API

2. **Authentication**:
   - Application Default Credentials (ADC) configured
   - Appropriate IAM permissions for Vertex AI and Cloud Storage

3. **Python Environment**:
   - Python 3.10 - 3.13
   - UV package manager installed

4. **RAG Corpus**: A Vertex AI RAG corpus with Samsung air conditioner documentation
   - Update the `rag_corpus` field in `technical_service_text_agent.py` with your corpus ID

## Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd agentic-era-hack
   ```

2. Install dependencies using UV:
   ```bash
   uv sync
   ```

## Configuration

### 1. Create Requirements File

Before deployment, you must create a `.requirements.txt` file in the project root directory. This file specifies the dependencies needed for the deployed agent.

Create `.requirements.txt` with the following content:

```txt
google-adk[extensions]
opentelemetry-exporter-gcp-trace
google-cloud-logging
google-cloud-aiplatform[adk,agent-engines,evaluation]
```

**Note**: This file is different from `pyproject.toml` and contains only the essential packages needed for the deployed agent runtime.

### 2. Update RAG Corpus

Edit `app/text_agents/technical_service_text_agent.py` and update the RAG corpus ID:

```python
ask_vertex_retrieval = VertexAiRagRetrieval(
    # Update this with your RAG corpus ID
    rag_corpus="projects/YOUR_PROJECT/locations/YOUR_LOCATION/ragCorpora/YOUR_CORPUS_ID"
)
```

### 3. Environment Variables

The agent automatically detects your Google Cloud project from Application Default Credentials. You can override these settings:

- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
- `GOOGLE_CLOUD_LOCATION`: Default location (global)
- `GOOGLE_GENAI_USE_VERTEXAI`: Set to "True" to use Vertex AI

## Deployment

Deploy the agent to Google Agent Engine using the following command:

```bash
uv run python .\app\text_agents\agent_engine_app.py
```

### Deployment Options

You can customize the deployment with additional parameters:

```bash
uv run python .\app\text_agents\agent_engine_app.py \
  --project YOUR_PROJECT_ID \
  --location us-central1 \
  --agent-name my-technical-agent \
  --service-account your-service-account@project.iam.gserviceaccount.com \
  --set-env-vars "KEY1=VALUE1,KEY2=VALUE2"
```

#### Available Parameters:

- `--project`: GCP project ID (defaults to ADC project)
- `--location`: GCP region (defaults to us-central1)
- `--agent-name`: Name for the agent engine (defaults to "techical-service-agent")
- `--requirements-file`: Path to requirements file (defaults to .requirements.txt)
- `--extra-packages`: Additional packages to include (defaults to ["./app"])
- `--set-env-vars`: Environment variables in KEY=VALUE format
- `--service-account`: Service account email for the agent engine

### Deployment Output

After successful deployment, the script will:
1. Create necessary GCS buckets for staging and artifacts
2. Deploy the agent to Vertex AI Agent Engine
3. Output the agent engine ID to `config.json`
4. Display a success message with the agent details

## Usage

### Using the Client

After deployment, use the provided client to interact with your deployed agent:

```bash
uv run python .\app\text_agents\technical_service_text_agent_client.py
```

### Client Code Example

The client demonstrates how to:

1. **Connect to the deployed agent**:
   ```python
   from vertexai import agent_engines
   
   app_name = 'projects/PROJECT_ID/locations/LOCATION/reasoningEngines/ENGINE_ID'
   adk_app = agent_engines.get(app_name)
   ```

2. **Create a session**:
   ```python
   async def get_session(user_id):
       session = await adk_app.async_create_session(user_id=user_id)
       return session
   ```

3. **Send queries**:
   ```python
   async def call_agent(query, session_id, user_id):
       async for event in adk_app.async_stream_query(
           user_id=user_id,
           session_id=session_id,
           message=query,
       ):
           print(event)
   ```

### Customizing the Client

To use the client with your deployed agent:

1. Update the `app_name` variable in `technical_service_text_agent_client.py` with your agent engine ID from `config.json`
2. Modify the query and user ID as needed
3. Run the client

### Example Interaction

```python
# Example usage
userId = "user123"
session = await get_session(userId)
await call_agent("Klima soğutmuyor, ne yapmalıyım?", session['id'], userId)
```

## Monitoring and Logging

The agent includes built-in monitoring features:

- **Cloud Logging**: All agent interactions are logged to Google Cloud Logging
- **Cloud Trace**: Request tracing for performance monitoring
- **Feedback Collection**: User feedback is collected and logged for analysis

### Viewing Logs

Access logs in the Google Cloud Console:
1. Go to Cloud Logging
2. Filter by resource: "Vertex AI Agent Engine"
3. Search for your agent name

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Ensure Application Default Credentials are configured: `gcloud auth application-default login`
   - Verify your account has necessary IAM permissions

2. **RAG Corpus Not Found**:
   - Verify the RAG corpus ID is correct
   - Ensure the corpus is in the same project and location

3. **Deployment Failures**:
   - Ensure `.requirements.txt` file exists in the project root
   - Check that all required APIs are enabled
   - Verify GCS bucket permissions
   - Ensure the service account has appropriate roles

4. **Client Connection Issues**:
   - Verify the agent engine ID in the client code
   - Check that the agent is deployed and running

### Getting Help

- Check the deployment logs for error messages
- Verify your Google Cloud project configuration
- Ensure all dependencies are properly installed

## Architecture

The system consists of:

1. **Technical Service Text Agent**: Core agent logic with RAG integration
2. **Agent Engine App**: ADK application wrapper with logging and tracing
3. **Client**: Example client for interacting with the deployed agent
4. **GCS Integration**: Artifact storage and staging buckets
5. **Monitoring**: Cloud Logging and Tracing integration

## Security Considerations

- Use service accounts with minimal required permissions
- Store sensitive configuration in environment variables
- Enable audit logging for production deployments
- Regularly update dependencies and security patches

## Development

For development and testing:

1. **Run tests**:
   ```bash
   uv run pytest tests/
   ```

2. **Local development**:
   - The agent can be tested locally before deployment
   - Use the ADK local development tools

3. **Code formatting**:
   ```bash
   uv run ruff format
   uv run ruff check
   ```

## License

Copyright 2025 Google LLC. Licensed under the Apache License, Version 2.0.
