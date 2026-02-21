/**
 * Vibe Coder Worker - MiniMax Proxy
 * 
 * This worker forwards requests to MiniMax API
 * API key is stored in Cloudflare Secrets (never in code)
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://witch-agent.github.io',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      // Get API key from secrets (set via: wrangler secret put MINIMAX_API_KEY)
      const apiKey = env.MINIMAX_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Parse request body
      const body = await request.json();
      const { topic, style } = body;

      if (!topic) {
        return new Response(JSON.stringify({ error: 'Topic is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Build the prompt based on style
      const prompt = buildPrompt(topic, style);

      // Call MiniMax API
      const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.5',
          messages: [
            {
              role: 'system',
              content: 'You are a creative UI/UX designer and full-stack developer. Generate detailed, professional prompts for building web applications. Output ONLY the prompt, no explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || 'No response generated';

      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

function buildPrompt(topic, style) {
  const stylePrompts = {
    hacker: `Generate a detailed prompt for building a "${topic}" web application.

The output MUST include these sections:

## 🎨 UI SPECIFICATION
- Single scrollable mobile/desktop screen
- Layout structure (header, hero, content, footer)
- Color palette (specific hex codes)
- Typography (font names, sizes, weights)
- Visual effects (shadows, glows, animations)
- Component details

## ⚡ FUNCTIONALITY  
- Core features and user flows
- Data handling requirements
- User interactions
- Edge cases to handle

## 🛠️ TECH STACK
- Recommended frameworks
- Libraries to use
- Architecture suggestions

## 💻 FRONTEND CODE
Provide actual, usable code snippets for key components.

Make it dark, data-dense, terminal-inspired with monospace fonts.`,
    
    neon: `Generate a detailed prompt for building a "${topic}" web application.

The output MUST include these sections:

## 🎨 UI SPECIFICATION
- Single scrollable mobile/desktop screen
- Layout structure
- Color palette (neon colors, hex codes)
- Typography (futuristic fonts)
- Glowing effects, gradients
- Animation details

## ⚡ FUNCTIONALITY
- Core features
- User interactions
- Data flows

## 🛠️ TECH STACK
- Recommended tools
- Framework suggestions

Make it cyberpunk-inspired with neon accents, dark backgrounds, glowing elements.`,

    minimal: `Generate a detailed prompt for building a "${topic}" web application.

The output MUST include these sections:

## 🎨 UI SPECIFICATION
- Clean, minimal layout
- Color palette (minimal, hex codes)
- Typography (clean fonts)
- Spacing and layout
- Subtle effects

## ⚡ FUNCTIONALITY
- Core features
- User flows

## 🛠️ TECH STACK
- Recommended tools

Make it Apple-inspired, ultra-clean with lots of whitespace, simple but elegant.`,

    brutalist: `Generate a detailed prompt for building a "${topic}" web application.

The output MUST include these sections:

## 🎨 UI SPECIFICATION
- Bold, raw layout
- Color palette (high contrast, hex codes)
- Typography (heavy, bold fonts)
- Sharp edges, no rounded corners
- Grid-based structure

## ⚡ FUNCTIONALITY
- Core features
- User interactions

## 🛠️ TECH STACK
- Recommended tools

Make it bold, industrial, high-contrast with exposed structure.`
  };

  return stylePrompts[style] || stylePrompts.hacker;
}
