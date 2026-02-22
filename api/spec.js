// Vercel API Route for Vibe Coder

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';

const stylePrompts = {
    minimal: 'Generate a minimal, clean specification',
    dark: 'Generate a dark, sleek specification',
    vibrant: 'Generate a vibrant, colorful specification',
    brutalist: 'Generate a brutalist, bold specification'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { topic, style } = req.body;
        
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        if (!MINIMAX_API_KEY) return res.status(500).json({ error: 'API key not configured' });
        
        const stylePrompt = stylePrompts[style] || stylePrompts.minimal;
        
        const userPrompt = `Create a detailed project specification for: ${topic}

Style: ${stylePrompt}

Include:
1. Project Name
2. Core Features (3-5 key features)
3. UI/UX Design Guidelines
4. Tech Stack Recommendations
5. File Structure
6. Key Components
7. Color Palette
8. Typography Suggestions

Write in a structured, technical format ready for developers.`;

        const response = await fetch(`${MINIMAX_BASE_URL}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': MINIMAX_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.5',
                max_tokens: 4096,
                system: 'You are a senior software architect. Create detailed, actionable project specifications.',
                messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: 'API failed', details: errorData });
        }
        
        const data = await response.json();
        let result = '';
        for (const block of data.content) {
            if (block.type === 'text') result += block.text;
        }
        
        return res.status(200).json({ result });
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
