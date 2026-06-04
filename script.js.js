// Hardcoded API Key and System configuration as requested
const GEMINI_API_KEY = "AQ.Ab8RN6IODWT7u-RjclEQd9i3Vlb0VjZBmYjGCEipcF4wIftV_A";

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
- If the user is a beginner, explain concepts in simple terms.
- Use bullet points and structured plans when appropriate.

Structure your response sections clearly with exactly these headings:
- ### Brief Assessment
- ### Key Recommendations
- ### Training Plan
- ### Next Steps`;

const INITIAL_WELCOME = "Welcome to the Tactical Unit, athlete. I am CoachAI. Tell me your age, playing position, and your primary target (e.g., stamina, shooting accuracy, first touch) so we can map out your progression.";

// Local Chat History holding UI formatting
let localMessages = [];

// DOM Selection
const messagesContainer = document.getElementById("messages-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const clearBtn = document.getElementById("clear-btn");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const suggestionChips = document.querySelectorAll(".suggestion-chip");

// Startup init
window.addEventListener("DOMContentLoaded", () => {
    resetChat();
});

// Toggle mobile navigation drawer
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// Clear log button
clearBtn.addEventListener("click", () => {
    if (confirm("Reset current tactical training session?")) {
        resetChat();
    }
});

// Prompt shortcuts setup
suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
        userInput.value = chip.getAttribute("data-prompt");
        userInput.focus();
    });
});

// Reset visual conversation
function resetChat() {
    localMessages = [
        { role: "model", content: INITIAL_WELCOME }
    ];
    messagesContainer.innerHTML = "";
    appendMessage("assistant", INITIAL_WELCOME);
}

// Custom Card Renderer
function appendMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.classList.add("message", role);
    bubble.innerHTML = role === "assistant" ? renderCoachCards(text) : renderUserText(text);
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Ensure safe text encoding for user input
function renderUserText(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}

// Render Gemini outputs into styled UI cards
function renderCoachCards(text) {
    let formatted = text;

    // Convert standard headers (### Section Name) into styled card components
    formatted = formatted.replace(/(?:^|\n)###\s*(Brief Assessment|Key Recommendations|Training Plan|Next Steps)/gi, (match, title) => {
        const styleClass = title.toLowerCase().replace(" ", "-");
        return `</div><div class="response-card ${styleClass}"><h5>${title}</h5>`;
    });

    // Translate markdown bold markers (**bold text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse list bullets gracefully
    const lines = formatted.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith("- ") || line.startsWith("* ")) {
            let content = line.substring(2);
            if (!inList) {
                lines[i] = "<ul><li>" + content + "</li>";
                inList = true;
            } else {
                lines[i] = "<li>" + content + "</li>";
            }
        } else {
            if (inList && line !== "") {
                lines[i - 1] += "</ul>";
                inList = false;
            }
        }
    }
    if (inList) {
        lines[lines.length - 1] += "</ul>";
    }
    
    formatted = lines.join('\n');

    // Wrap floating initial text inside a general card container
    if (formatted.startsWith("</div>")) {
        formatted = formatted.substring(6);
    } else {
        formatted = `<div class="response-card general">` + formatted;
    }
    formatted += "</div>";

    // Convert line endings to breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

// Request dispatcher calling Google API endpoint directly
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = userInput.value.trim();
    if (!query) return;

    // Display user bubble and save state
    appendMessage("user", query);
    localMessages.push({ role: "user", content: query });
    userInput.value = "";

    // Typing Loader indicator
    const loader = document.createElement("div");
    loader.classList.add("message", "assistant");
    loader.innerHTML = `
        <div style="display: flex; gap: 4px; align-items: center;">
            <span style="font-family:'Space Grotesk'">CoachAI is evaluating</span>
            <span class="loading-dots" style="color:var(--neon-green)">...</span>
        </div>
    `;
    messagesContainer.appendChild(loader);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Build the conversation history structure
        const apiContents = localMessages
            .filter((msg, idx) => !(idx === 0 && msg.role === "model"))
            .map(msg => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }]
            }));

        // Send payload directly to the Google endpoint using the embedded key
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: apiContents,
                systemInstruction: {
                    parts: [{ text: COACH_PERSONA }]
                }
            })
        });

        // Remove indicator
        messagesContainer.removeChild(loader);

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Communication failure.");
        }

        const data = await response.json();
        
        // Extract text response
        const outputText = data.candidates[0].content.parts[0].text;

        // Save states
        localMessages.push({ role: "model", content: outputText });
        appendMessage("assistant", outputText);

    } catch (err) {
        if (messagesContainer.contains(loader)) {
            messagesContainer.removeChild(loader);
        }
        appendMessage("assistant", `⚠️ Connection Error: ${err.message}`);
    }
});