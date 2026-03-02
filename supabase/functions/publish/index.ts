// Supabase Edge Function: publish
// Proxies workflow_dispatch to GitHub Actions so the PAT never reaches the browser.
//
// Secrets needed (set via `supabase secrets set`):
//   GITHUB_PAT          — fine-grained PAT with Actions:write on the repo
//
// Called from admin.html with the user's Supabase session token.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GITHUB_REPO = "UPan7/helferportal-prototypes";
const GITHUB_WORKFLOW = "deploy-content.yml";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Auth: verify Supabase JWT ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing auth token" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Parse body ---
  let pageId = "";
  try {
    const body = await req.json();
    pageId = body.page_id || "";
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // --- Trigger GitHub Actions ---
  const pat = Deno.env.get("GITHUB_PAT");
  if (!pat) {
    return json({ error: "GITHUB_PAT not configured" }, 500);
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "helferportal-cms",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { page_id: pageId },
      }),
    },
  );

  if (ghRes.status === 204 || ghRes.ok) {
    console.log(`[publish] user=${user.email} page=${pageId || "all"}`);
    return json({ ok: true, page_id: pageId });
  }

  const ghBody = await ghRes.text();
  console.error(`[publish] GitHub API ${ghRes.status}: ${ghBody}`);
  return json({ error: "GitHub API error", status: ghRes.status }, 502);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
