# Deployment Guide - Vibe Coder Worker

## Prerequisites

1. Cloudflare account (free)
2. Node.js installed locally
3. MiniMax API key

## Setup Steps

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Set API Key Secret

```bash
cd worker
wrangler secret put MINIMAX_API_KEY
# Enter your MiniMax API key when prompted
```

### 4. Deploy Worker

```bash
wrangler deploy
```

This will give you a URL like: `https://vibe-coder-api.your-username.workers.dev`

### 5. Update Frontend

Edit `index.html` and replace the API call:

```javascript
// Before (template-based)
const spec = specGenerators[selectedStyle](prompt);

// After (API-based)
const response = await fetch('YOUR_WORKER_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: prompt, style: selectedStyle })
});
const data = await response.json();
const spec = data.result;
```

### 6. Test

Visit your site and try generating a spec!

---

## Security Notes

- API key is stored in Cloudflare Secrets (encrypted)
- Key never leaves Cloudflare infrastructure
- Only your frontend domain can make requests (CORS)
- Rate limiting can be added in worker

---

## Cost

- Cloudflare Workers: FREE (100K requests/month)
- MiniMax: Pay per use
