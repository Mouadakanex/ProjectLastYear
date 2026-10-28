Movite AI helper
- agent.js implements the marketplace chat UI, saved conversation, photo and audio attachment, and AI listing-draft workflow.
- Backend requests go to ../backend/server.js at /api/agent. Configure GEMINI_API_KEY in the environment when starting the local server.
- Conversation messages are stored in browser local storage. Do not store private or sensitive information in this demo.
