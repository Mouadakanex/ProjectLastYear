Movite Market — local launch

1. From PowerShell, open the backend folder:
   cd C:\Users\Solicode\Desktop\maqutage\backend
2. Set your Gemini API key:
   $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
3. Start the API:
   node server.js
4. Open the site files with VS Code Live Server (or another local static web server).

The AI assistant accepts Darija, Arabic, French, and English messages, product photos, and voice recordings. It prepares a listing draft for you to review. You must enter the price and confirm the product details before publishing.

The backend stores published products in backend/Movite.db. Keep the Gemini API key private.

