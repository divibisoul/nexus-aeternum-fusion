import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  input: unknown;
  context?: Record<string, unknown>;
  capability?: string;
};

function toPrompt(input: unknown, context: Record<string, unknown> = {}, capability = "cognitive-ui"): string {
  const serialized = typeof input === "string" ? input : JSON.stringify(input);
  return [
    "You are the N03 Nexus cognitive runtime inside a hybrid six-nucleus AI system called Soul.",
    `Capability: ${capability}`,
    "Treat other nuclei as independent AI systems. Do not impersonate another nucleus.",
    "Return useful, factual output and clearly distinguish model inference from verified system state.",
    `Context: ${JSON.stringify(context)}`,
    `Input: ${serialized}`,
  ].join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY is not configured in the server environment");

    const { input, context, capability }: RequestBody = await req.json();
    if (input === undefined || input === null) throw new Error("input is required");

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";
    const prompt = toPrompt(input, context, capability);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI_PROVIDER_ERROR", provider: "gemini", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
    return new Response(JSON.stringify({
      provider: "gemini",
      model,
      capability,
      text,
      responseId: data?.responseId ?? null,
      usageMetadata: data?.usageMetadata ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "N03_AI_GATEWAY_ERROR",
      message: error instanceof Error ? error.message : String(error),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
