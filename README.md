# 🎯 Live Technical Agent - Google Hackathon Project

**Revolutionizing Customer Support with AI-Powered Voice Assistance**

Meet Mahmut, your Samsung air conditioner expert! This live audio conversational agent transforms customer support by providing instant, accurate technical assistance using Vertex AI RAG engine and user manuals.

## 🚀 Why This Matters

**The Problem**: Every company has call centers where customers wait in long queues for simple technical questions about their products.

**Our Solution**: An intelligent voice agent that instantly answers technical questions, dramatically reducing call center load and providing 24/7 support.

### Real-World Impact:
- **📞 Reduce Call Center Volume**: Handle 80% of common technical queries automatically
- **⚡ Instant Support**: No more waiting on hold - get answers in seconds
- **🌍 24/7 Availability**: Round-the-clock technical assistance
- **💰 Cost Effective**: Massive reduction in human agent workload
- **📚 Always Updated**: Powered by official user manuals via RAG technology

## 🎯 Demo Scenario
*"I just bought a Samsung air conditioner, but I don't know how to set the timer function."*

Instead of calling support and waiting 20 minutes, simply talk to Mahmut:
- **Voice-to-Voice**: Natural conversation in your language
- **Instant Answers**: Powered by official Samsung documentation
- **Step-by-Step**: Clear instructions for any technical question

Built with Gemini Live API and Vertex AI RAG for enterprise-grade accuracy.

## 🚀 Quick Start

Get the agent running in under 2 minutes:

```bash
make install && make playground
```

Then open `http://localhost:8000` and start talking to Mahmut!

## 🛠️ Technical Stack

- **Voice AI**: Gemini Live API for natural conversation
- **Knowledge Base**: Vertex AI RAG with Samsung user manuals
- **Backend**: FastAPI with real-time audio streaming
- **Frontend**: React-based voice interface
- **Infrastructure**: Google Cloud Platform ready

## 📋 Development Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `make install`       | Install dependencies                        |
| `make playground`    | Launch full development environment         |
| `make local-backend` | Start backend server only                   |
| `make test`          | Run tests                                   |
| `make backend`       | Deploy to Google Cloud                      |

## 🎮 Try It Out

1. **Start the application:**
   ```bash
   make local-backend
   ```

2. **Open your browser** to `http://localhost:8000`

3. **Click the play button** and ask Mahmut:
   - *"How do I set the timer on my air conditioner?"*
   - *"What does the error code E4 mean?"*
   - *"How do I clean the filter?"*

## 🚀 Deployment

Deploy to Google Cloud in one command:
```bash
gcloud config set project <your-project-id>
make backend
```

---

**Built for Google Hackathon** | Powered by Gemini Live API & Vertex AI RAG