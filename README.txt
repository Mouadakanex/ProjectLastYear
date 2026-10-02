Movite Market — local launch

The marketplace UI opens from so9.html. To use the AI chat, create or use your Gemini API key and keep it private in an environment variable; never paste it into the HTML or JavaScript.

Windows PowerShell:
  $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
  node server.mjs

Then open http://localhost:3000. The chat button (class .gpt) accepts messages, photos, and audio. When AI drafts a listing, the separate edit page lets you review and change the name, price, category, city, condition, and description before publishing. Published listings are stored in this browser's local storage.

Node.js must be installed. Gemini API usage is billed according to Google's current API pricing and account terms. The demo marketplace cards and sign-in button are sample UI; account login and a shared online database are not configured.
