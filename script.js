// 🔐 Put your NEW Gemini API key here (AIza...)
const GEMINI_API_KEY = "AQ.Ab8RN6LzpQakvC-TtCMb2CH21m1FM4Gm6GQzrJ73zHuBNv9_aA";

// 🧠 Coach Persona
const COACH_PERSONA = `You are CoachAI, an intelligent football coaching chatbot designed for students and amateur football players. 
Your role is to act like a professional football coach. Help users improve their football skills, fitness, tactics, and understanding of the game. 

Rules:
- Be encouraging, practical, and professional.
- Give clear and actionable advice.
- Ask follow-up questions when information is missing.
- Adapt recommendations based on the user's age, position, skill level, and goals.
- Keep explanations simple and easy to understand.
- Focus on player development, training, tactics, nutrition, recovery, and mindset.
- Never give unsafe training advice.
- Use structured sections:
### Brief Assessment
### Key Recommendations
### Training Plan
### Next Steps`;

// 💬 Chat memory
let localMessages = [];

// DOM
const messagesContainer = document.getElementById("messages-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// 🟢 Init message
window.addEventListener("DOMContentLoaded", () => {
    resetChat();
});

function resetChat() {
    localMessages = [
        { role: "model", content: "Welcome to CoachAI. Tell me your position, age, and goal." }
    ];
    messagesContainer.innerHTML = "";
    appendMessage("assistant", localMessages[0].content);
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

// 🚀 Send message
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = userInput.value.trim();
    if (!query) return;

    appendMessage("user", query);
    localMessages.push({ role: "user", content: query });
    userInput.value = "";

    // loading
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

        messagesContainer.removeChild(loader);

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "API Error");
        }

        const data = await res.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

        localMessages.push({ role: "model", content: output });
        appendMessage("assistant", output);

    } catch (err) {
        if (messagesContainer.contains(loader)) {
            messagesContainer.removeChild(loader);
        }
        appendMessage("assistant", "⚠️ Error: " + err.message);
    }
});
