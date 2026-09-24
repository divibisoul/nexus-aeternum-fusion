const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-3.8-flash";
const MAX_MESSAGE_CHARS = 100_000;

interface GeminiChatRequest {
  message: string;
  context?: string;
  hasAttachments?: boolean;
}

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";
  if (!key.trim()) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  return key.trim();
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates)) return "";
  return candidates
    .flatMap(candidate => {
      if (!candidate || typeof candidate !== "object") return [];
      const content = (candidate as { content?: { parts?: unknown[] } }).content;
      if (!content || !Array.isArray(content.parts)) return [];
      return content.parts.flatMap(part => {
        if (!part || typeof part !== "object") return [];
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("")
    .trim();
}

function extractUsage(payload: unknown): Record<string, number> | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const usage = (payload as { usageMetadata?: Record<string, unknown> }).usageMetadata;
  if (!usage) return undefined;
  const numericKeys = ["promptTokenCount", "candidatesTokenCount", "totalTokenCount", "thoughtsTokenCount"];
  const out: Record<string, number> = {};
  for (const key of numericKeys) {
    const value = usage[key];
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startedAt = performance.now();
  try {
    const body = (await request.json()) as GeminiChatRequest;
    const message = String(body?.message ?? "").trim();
    if (!message) {
      return new Response(JSON.stringify({ error: "MESSAGE_REQUIRED" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      return new Response(JSON.stringify({ error: "MESSAGE_TOO_LARGE", maxChars: MAX_MESSAGE_CHARS }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptParts = [
      "Você é o motor de linguagem do sistema AETERNUM/SOUL.",
      "Responda somente com base no conteúdo da solicitação e no contexto explicitamente recebido.",
      "Não afirme que módulos, auditorias, governança, consciência, remediação, métricas ou integrações foram executados quando isso não estiver presente no contexto.",
      "Diferencie resultado observado, contrato, hipótese e pendência.",
      body.context?.trim() ? "Contexto explícito: " + body.context.trim() : "",
      body.hasAttachments ? "Há anexos informados; só considere-os analisados se seus dados forem realmente enviados ao endpoint." : "",
      "Solicitação do usuário:\n" + message,
    ].filter(Boolean);

    const response = await fetch(API_BASE + "/models/" + MODEL + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": getApiKey() },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptParts.join("\n\n") }] }] }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: { message?: unknown } }).error?.message ?? "provider error")
        : "provider error";
      return new Response(JSON.stringify({
        error: "GEMINI_PROVIDER_ERROR",
        providerStatus: response.status,
        message: providerMessage.slice(0, 1000),
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = extractText(payload);
    if (!content) {
      return new Response(JSON.stringify({ error: "GEMINI_EMPTY_RESPONSE" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      content,
      model: MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      usage: extractUsage(payload) ?? null,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "GEMINI_CHAT_FAILED",
      message: error instanceof Error ? error.message : String(error),
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
