export interface BackendTable {
  name: string;
  sql: string;
}

export interface BackendFunction {
  name: string;
  code: string;
}

export interface BackendResult {
  tables: BackendTable[];
  edgeFunctions: BackendFunction[];
  updatedHtml: string;
  features: string[];
}

type Phase = "generating" | "deploying" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Strip CSS content from <style> tags to reduce token count.
 * The AI only needs to see the HTML structure, not the full styles.
 */
function stripStyleContent(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "<style>/* styles omitted for brevity */</style>");
}

/**
 * Phase 2+3: generate backend plan via AI, then deploy it.
 * Returns the final HTML with live backend connections.
 */
export async function generateAndDeployBackend({
  html,
  userPrompt,
  sessionId,
  conversationId,
  onPhase,
}: {
  html: string;
  userPrompt: string;
  sessionId: string;
  conversationId: string;
  onPhase: (phase: Phase) => void;
}): Promise<BackendResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables not configured");
  }

  // ── Phase 2: Generate backend plan ──
  onPhase("generating");

  const strippedHtml = stripStyleContent(html);

  const genResp = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-backend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ html: strippedHtml, userPrompt, fullHtml: html }),
    }
  );

  if (!genResp.ok) {
    const err = await genResp.json().catch(() => ({ error: "Ошибка генерации бэкенда" }));
    throw new Error(err.error || `Backend generation failed: HTTP ${genResp.status}`);
  }

  const plan = await genResp.json();

  // ── Phase 3: Deploy backend ──
  onPhase("deploying");

  const deployResp = await fetch(
    `${SUPABASE_URL}/functions/v1/deploy-backend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        tables: plan.tables,
        edge_functions: plan.edge_functions,
        updated_html: plan.updated_html,
        sessionId,
        conversationId,
      }),
    }
  );

  if (!deployResp.ok) {
    const err = await deployResp.json().catch(() => ({ error: "Ошибка деплоя бэкенда" }));
    throw new Error(err.error || `Backend deploy failed: HTTP ${deployResp.status}`);
  }

  const result = await deployResp.json();

  onPhase("done");

  return {
    tables: plan.tables || [],
    edgeFunctions: plan.edge_functions || [],
    updatedHtml: result.finalHtml || html,
    features: plan.features || [],
  };
}
