// 🔐 API KEY (PUT YOUR REAL AI STUDIO KEY HERE - must start with AIza...)
const GEMINI_API_KEY = "AQ.Ab8RN6IuhG7suEk6z5PiosSeJ0HroHk_6aDpAxuwlmrj2l7-vw";

// 🧠 Model (2.5 Flash with safe fallback option)
const MODEL_NAME = "gemini-2.5-flash"; // if error → change to "gemini-1.5-flash"

// 🧠 Coach Persona
const COACH_PERSONA = `
You are CoachAI, a professional football coaching assistant.

Rules:
- Be structured and practical
- Give actionable training advice
- Adapt to age, position, skill level
- Ask follow-up questions when needed

Format:
### Brief Assessment
### Key Recommendations
### Training Plan
### Next Steps
`;

// 💬 Memory store
let localMessages = [];

// DOM
const messagesContainer = document.getElementById("messages-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// 🚀 Init
window.addEventListener("DOMContentLoaded", resetChat);

function resetChat() {
    localMessages = [];
    messagesContainer.innerHTML = "";

    appendMessage("assistant",
        "Welcome to CoachAI. Tell me your age, position, and goal."
    );
}

// 🧾 Render messages
function appendMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.classList.add("message", role);

    const div = document.createElement("div");
    div.innerText = text;

    bubble.appendChild(div);
    messagesContainer.appendChild(bubble);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 🧠 Send message
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = userInput.value.trim();
    if (!query) return;

    appendMessage("user", query);
    localMessages.push({ role: "user", content: query });
    userInput.value = "";

    // loader
    const loader = document.createElement("div");
    loader.classList.add("message", "assistant");
    loader.innerText = "CoachAI is thinking...";
    messagesContainer.appendChild(loader);

    try {
        const contents = localMessages.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        }));

        const endpoint =
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents,
                systemInstruction: {
                    parts: [{ text: COACH_PERSONA }]
                }
            })
        });

        if (messagesContainer.contains(loader)) {
            messagesContainer.removeChild(loader);
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error?.message || "API request failed");
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error("Empty response from Gemini");
        }

        const output = data.candidates[0].content.parts[0].text;

        localMessages.push({ role: "model", content: output });
        appendMessage("assistant", output);

    } catch (err) {
        if (messagesContainer.contains(loader)) {
            messagesContainer.removeChild(loader);
        }

        appendMessage("assistant", "⚠️ Error: " + err.message);
    }
});
