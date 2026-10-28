const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getRecentProducts(db) {
    return db.prepare(
        "SELECT name, price, description FROM products ORDER BY id DESC LIMIT 30"
    ).all();
}

function buildInstructions(products) {
    return `
You are Movite, a helpful Moroccan marketplace assistant.
Reply in the user's language and style (Darija, Arabic, French, or English).
Understand attached voice recordings as the user's spoken message.
For a vehicle photo, actively identify the make, model, trim, and generation from distinctive visible cues such as the badge, headlights, body, and aero details. Never use a vague or color-only title such as "white sports car" or "tonobil sport byda" when the make/model can be identified. Start the title with the specific make and model, and include the trim when visually supportable.
For vehicle listings, include a short labeled specification block in the description: likely make/model/trim, published top speed in km/h, and the year the exact model or generation was first introduced. Use manufacturer or other reliable published specifications from your knowledge; do not confuse model top speed with this particular car's measured speed.
State clearly when a spec or identification is uncertain. If the exact trim cannot be distinguished, say so and use only the likely model. Do not invent a year, engine, horsepower, top speed, or trim.
From the photo, only describe whether the design/generation appears visually modern or older. Never claim the photo proves this individual vehicle's actual manufacture year, mileage, mechanical condition, or whether it is new or used. Tell the seller those details must be confirmed.
For other products, continue to identify only supportable visible details. Write clear, persuasive descriptions without inventing specifications, condition, price, or guarantees.

Return valid JSON only:
{"reply":"...","action":null}
or an action {"type":"create_listing","title":"...","price":"","category":"Electronics|Home|Fashion|Sports|Cars|Other","city":"Casablanca","condition":"Used|New","description":"...","price_basis":"..."}
or {"type":"search","query":"..."}.

When the user wants to list an attached item, prepare a reviewable draft with a specific title and useful description.
For vehicle photos, write the description in the user's language and use separate lines for the likely model, published top speed, first model/generation launch year, and visual age impression. Mark uncertain items as "غير مؤكد" (or equivalent in the user's language). Explicitly say the exact manufacture year and condition need seller confirmation.
Never guess the sale price; leave it blank and ask the seller to enter it.
Current listings: ${JSON.stringify(products)}
`;
}

function makeHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
        .filter(turn =>
            turn &&
            ["user", "assistant"].includes(turn.role) &&
            typeof turn.text === "string"
        )
        .slice(-12)
        .map(turn => ({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.text.slice(0, 3000) }]
        }));
}

function addMedia(parts, data, mimeType) {
    if (!data) return null;

    if (!mimeType || !/^(image\/(jpeg|png|webp)|audio\/[a-zA-Z0-9.+-]+)$/.test(mimeType)) {
        return { error: "Unsupported attachment type." };
    }

    if (data.length > 12 * 1024 * 1024) {
        return { error: "Attachment is too large." };
    }

    parts.push({
        inline_data: {
            mime_type: mimeType,
            data
        }
    });

    return null;
}

async function getGeminiReply(apiKey, requestBody, systemInstruction) {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: requestBody,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(result.error?.message || "The AI service request failed.");
        error.status = 502;
        throw error;
    }

    const text = result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "{}";

    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
}

function registerAgentRoutes(app, db) {
    app.post("/api/agent", async (req, res) => {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(503).json({
                error: "AI is not configured. Set GEMINI_API_KEY before starting the server."
            });
        }

        const {
            message = "",
            image,
            imageMime,
            audio,
            audioMime,
            history
        } = req.body || {};

        const contents = makeHistory(history);
        const lastTurn = contents.at(-1);

        if (lastTurn?.role === "user" && lastTurn.parts[0]?.text === String(message || "")) {
            // Keep the typed text in conversation history; attachments are added to this same turn below.
        } else if (image || audio) {
            contents.push({
                role: "user",
                parts: [{ text: String(message || "Please help me with this attachment.") }]
            });
        }

        const currentTurn = contents.at(-1);
        if (image || audio) {
            if (!currentTurn || currentTurn.role !== "user") {
                contents.push({ role: "user", parts: [{ text: String(message || "Please help me with this attachment.") }] });
            }

            const parts = contents.at(-1).parts;
            const imageError = addMedia(parts, image, imageMime);
            if (imageError) return res.status(400).json(imageError);

            const audioError = addMedia(parts, audio, audioMime);
            if (audioError) return res.status(400).json(audioError);
        }

        if (!contents.length) {
            contents.push({
                role: "user",
                parts: [{ text: String(message || "Hello") }]
            });
        }

        try {
            const reply = await getGeminiReply(
                apiKey,
                contents,
                buildInstructions(getRecentProducts(db))
            );

            return res.json({
                reply: String(reply.reply || "How can I help?"),
                action: reply.action || null
            });
        } catch (error) {
            console.error("Movite AI request failed:", error.message);
            return res.status(error.status || 502).json({ error: error.message });
        }
    });
}

module.exports = registerAgentRoutes;




