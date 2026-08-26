import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-soul-mesh-secret",
};

const NUCLEI = new Set(["N01", "N02", "N03", "N04", "N05", "N06"]);
const CAPABILITY_FUNCTIONS: Record<string, string> = {
  "voice-input": "soul-voice-processing",
  "voice-output": "soul-voice-processing",
  "speech-processing": "soul-voice-processing",
  "emotion-analysis": "soul-voice-processing",
  "spiritual-wisdom": "soul-spiritual-wisdom",
  "plant-knowledge": "soul-spiritual-wisdom",
  "ritual-knowledge": "soul-spiritual-wisdom",
  "frequency-context": "soul-spiritual-wisdom",
  "cognitive-ui": "nexus-ai",
  "multimodal-input": "nexus-ai",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function validMessage(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return m.protocol === "soul-mesh/1"
    && typeof m.id === "string"
    && typeof m.correlationId === "string"
    && typeof m.source === "string"
    && typeof m.target === "string"
    && NUCLEI.has(m.source)
    && m.target === "N03"
    && typeof m.kind === "string"
    && typeof m.capability === "string";
}

function functionBody(capability: string, payload: unknown): Record<string, unknown> {
  const input = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : { input: payload };
  if (capability === "voice-input" || capability === "speech-processing") return { action: "speech-to-text", ...input };
  if (capability === "voice-output") return { action: "text-to-speech", ...input };
  if (capability === "emotion-analysis") return { action: "emotional-analysis", ...input };
  if (capability === "plant-knowledge") return { query: typeof payload === "string" ? payload : JSON.stringify(payload), context: "plant_medicine", user_level: "intermediate" };
  if (capability === "ritual-knowledge") return { query: typeof payload === "string" ? payload : JSON.stringify(payload), context: "ritual", user_level: "intermediate" };
  if (capability === "frequency-context") return { query: typeof payload === "string" ? payload : JSON.stringify(payload), context: "frequency", user_level: "intermediate" };
  if (capability === "spiritual-wisdom") return { query: typeof payload === "string" ? payload : JSON.stringify(payload), context: "guidance", user_level: "intermediate" };
  return { input: payload, capability };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sharedSecret = Deno.env.get("SOUL_MESH_SHARED_SECRET");
  if (sharedSecret && req.headers.get("x-soul-mesh-secret") !== sharedSecret) return json({ error: "UNAUTHORIZED" }, 401);

  try {
    const message = await req.json();
    if (!validMessage(message)) return json({ error: "INVALID_SOUL_MESH_MESSAGE" }, 400);
    if (message.kind !== "request") return json({ accepted: true, correlationId: message.correlationId, source: "N03", target: message.source });

    if (message.capability === "mesh.ping") {
      return json({ protocol: "soul-mesh/1", id: crypto.randomUUID(), correlationId: message.correlationId, source: "N03", target: message.source, kind: "response", capability: "mesh.ping", payload: { ok: true, nucleus: "N03" }, timestamp: Date.now() });
    }

    if (message.capability === "mesh.describe" || message.capability === "mesh.capabilities") {
      return json({ protocol: "soul-mesh/1", id: crypto.randomUUID(), correlationId: message.correlationId, source: "N03", target: message.source, kind: "response", capability: message.capability, payload: { nucleus: "N03", protocol: "soul-mesh/1", capabilities: [...Object.keys(CAPABILITY_FUNCTIONS), "mesh.ping", "mesh.describe", "mesh.capabilities", "mesh.invoke"], executable: Object.keys(CAPABILITY_FUNCTIONS), status: "online" }, timestamp: Date.now() });
    }

    if (message.capability === "mesh.invoke") {
      const requested = (message.payload as { capability?: unknown } | null)?.capability;
      const capability = typeof requested === "string" ? requested : "";
      if (!CAPABILITY_FUNCTIONS[capability]) return json({ error: "CAPABILITY_NOT_FOUND", capability }, 404);
      message.capability = capability;
    }

    const functionName = CAPABILITY_FUNCTIONS[message.capability as string];
    if (!functionName) return json({ protocol: "soul-mesh/1", id: crypto.randomUUID(), correlationId: message.correlationId, source: "N03", target: message.source, kind: "error", capability: message.capability, payload: { code: "CAPABILITY_HANDLER_NOT_REGISTERED", nucleus: "N03" }, timestamp: Date.now() }, 501);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
    const authorization = req.headers.get("authorization");
    const apikey = req.headers.get("apikey");
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
        ...(apikey ? { apikey } : {}),
      },
      body: JSON.stringify(functionBody(message.capability as string, message.payload)),
    });
    const payload = await upstream.json().catch(() => ({ error: "UPSTREAM_NON_JSON" }));

    return json({
      protocol: "soul-mesh/1",
      id: crypto.randomUUID(),
      correlationId: message.correlationId,
      source: "N03",
      target: message.source,
      kind: upstream.ok ? "response" : "error",
      capability: message.capability,
      payload,
      timestamp: Date.now(),
    }, upstream.ok ? 200 : upstream.status);
  } catch (error) {
    return json({ error: "SOUL_MESH_GATEWAY_ERROR", message: error instanceof Error ? error.message : String(error) }, 500);
  }
});
