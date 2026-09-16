// Cloudflare Pages Function — serves POST /api
// Replaces the standalone english-writer Worker. The page calls "/api" on the
// same site, so there is no CORS and no ALLOWED_ORIGIN to maintain.
// Secret required (Pages → Settings → Variables and Secrets): ANTHROPIC_API_KEY

const ALLOWED_MODELS = ["claude-sonnet-4-6"];

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: "Request body is not valid JSON" } }, 400);
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return json({ error: { message: "Model not allowed: " + body.model } }, 400);
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
