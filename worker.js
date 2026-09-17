// english-writer-app — Cloudflare Worker with static assets
// The pages (index.html, index2.html, indexENG.html) are served as static assets.
// Requests to /api don't match any file, so they reach this code, which adds
// the Anthropic key and forwards them.
// Secret required (Worker → Settings → Variables and Secrets): ANTHROPIC_API_KEY

const ALLOWED_MODELS = ["claude-sonnet-4-6"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api") {
      if (request.method !== "POST") {
        return json({ error: { message: "Method not allowed" } }, 405);
      }
      return handleApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: "Request body is not valid JSON" } }, 400);
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return json({ error: { message: "Model not allowed: " + body.model } }, 400);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: { message: "ANTHROPIC_API_KEY secret is missing" } }, 500);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
