const $ = selector => document.querySelector(selector);
const API_BASE = "http://localhost:3000/api";

const button = $("#agentButton");
const panel = $("#agentPanel");
const messages = $("#messages");

let photo = null;
let audio = null;
let recorder = null;
let recordedChunks = [];
let recordingStream = null;

const history = JSON.parse(localStorage.getItem("movite-agent-history") || "[]");

for (const turn of history) {
    const node = document.createElement("div");
    node.className = `agent-message ${turn.role === "user" ? "user" : "assistant"}`;
    node.textContent = turn.text;
    messages.append(node);
}

function saveHistory() {
    localStorage.setItem("movite-agent-history", JSON.stringify(history));
}

function openChat() {
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    $("#messageInput").focus();
}

function closeChat() {
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
    button.focus();
}

button.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
$("#closeAgent").addEventListener("click", closeChat);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) closeChat();
});

function bubble(text, role = "assistant") {
    const item = document.createElement("div");
    item.className = `agent-message ${role}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
}

function showFiles() {
    const box = $("#attachment");
    const items = [];

    if (photo) {
        items.push(`Photo: ${photo.name} <button type="button" data-file="photo" aria-label="Remove photo">×</button>`);
    }

    if (audio) {
        items.push(`Audio: ${audio.name} <button type="button" data-file="audio" aria-label="Remove audio">×</button>`);
    }

    box.innerHTML = items.join(" · ");
    box.hidden = items.length === 0;

    box.querySelectorAll("button").forEach(item => {
        item.addEventListener("click", () => {
            if (item.dataset.file === "photo") {
                photo = null;
                $("#photoInput").value = "";
            } else {
                audio = null;
                $("#audioInput").value = "";
            }

            showFiles();
        });
    });
}

$("#photoButton").addEventListener("click", () => $("#photoInput").click());
$("#photoInput").addEventListener("change", event => {
    photo = event.target.files[0] || null;
    showFiles();
});

$("#audioInput").addEventListener("change", event => {
    audio = event.target.files[0] || null;
    showFiles();
});

$("#audioButton").addEventListener("click", async () => {
    if (recorder?.state === "recording") {
        recorder.stop();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        $("#audioInput").click();
        return;
    }

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        recorder = new MediaRecorder(recordingStream);

        recorder.ondataavailable = event => {
            if (event.data.size) recordedChunks.push(event.data);
        };

        recorder.onstop = () => {
            audio = new File(recordedChunks, `voice-${Date.now()}.webm`, {
                type: recorder.mimeType || "audio/webm"
            });

            recordingStream.getTracks().forEach(track => track.stop());
            recordingStream = null;
            $("#audioButton").textContent = "♫";
            $("#audioButton").setAttribute("aria-label", "Record voice message");
            showFiles();
        };

        recorder.start();
        $("#audioButton").textContent = "■";
        $("#audioButton").setAttribute("aria-label", "Stop recording");
    } catch (error) {
        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
        }

        recordingStream = null;
        bubble("Could not access the microphone. Choose an audio file instead.", "pending");
        $("#audioInput").click();
    }
});

function toBase64(file) {
    if (file.size > 8 * 1024 * 1024) {
        throw new Error("Choose a file smaller than 8 MB.");
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.readAsDataURL(file);
    });
}

$("#chatForm").addEventListener("submit", async event => {
    event.preventDefault();

    const text = $("#messageInput").value.trim();
    const sentPhoto = photo;
    const sentAudio = audio;

    if (!text && !sentPhoto && !sentAudio) return;

    const shownText = text || [
        sentPhoto && "[Product photo attached]",
        sentAudio && "[Voice message attached]"
    ].filter(Boolean).join(" ");

    const sent = bubble(shownText, "user");
    history.push({ role: "user", text: shownText });
    saveHistory();

    if (sentPhoto) {
        const img = document.createElement("img");
        img.className = "agent-photo";
        img.alt = "Attached product";
        img.src = URL.createObjectURL(sentPhoto);
        sent.append(img);
    }

    if (sentAudio) {
        const label = document.createElement("small");
        label.textContent = `Audio attached: ${sentAudio.name}`;
        sent.append(document.createElement("br"), label);
    }

    $("#messageInput").value = "";
    photo = null;
    audio = null;
    $("#photoInput").value = "";
    $("#audioInput").value = "";
    showFiles();

    const pending = bubble("Thinking…", "pending");
    const sendButton = $("#sendButton");
    sendButton.disabled = true;

    try {
        const payload = {
            message: text,
            history: history.slice(-12)
        };

        if (sentPhoto) {
            payload.image = await toBase64(sentPhoto);
            payload.imageMime = sentPhoto.type;
        }

        if (sentAudio) {
            payload.audio = await toBase64(sentAudio);
            payload.audioMime = sentAudio.type;
        }

        const response = await fetch(`${API_BASE}/agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The AI assistant could not reply.");

        pending.remove();
        const answer = result.reply || "How can I help?";
        bubble(answer);
        history.push({ role: "assistant", text: answer });
        saveHistory();

        if (result.action?.type === "create_listing") {
            const image = sentPhoto
                ? `data:${sentPhoto.type};base64,${await toBase64(sentPhoto)}`
                : "";

            localStorage.setItem("movite-draft", JSON.stringify({
                ...result.action,
                image,
                category: result.action.category || "Other",
                city: result.action.city || "Casablanca"
            }));

            location.href = "index.html";
        }

        if (result.action?.type === "search" && result.action.query) {
            const search = $("#searchInput");

            if (search) {
                search.value = result.action.query;
                search.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }
    } catch (error) {
        pending.textContent = error.message.includes("Failed to fetch")
            ? "Can’t reach the AI server. Start it with GEMINI_API_KEY set."
            : error.message;
        pending.classList.add("pending");

        if (sentPhoto) {
            photo = sentPhoto;
            $("#photoInput").value = "";
        }

        if (sentAudio) {
            audio = sentAudio;
            $("#audioInput").value = "";
        }

        showFiles();
    } finally {
        sendButton.disabled = false;
    }
});



