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

export default async function handler(req, res) {
    // Check for POST request method
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { contents } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Validate that the system environment variable is set
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'GEMINI_API_KEY is not configured on the host server.' 
        });
    }

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: COACH_PERSONA }]
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return res.status(response.status).json({ 
                error: errData.error?.message || 'Error communicating with Google Gemini API' 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
