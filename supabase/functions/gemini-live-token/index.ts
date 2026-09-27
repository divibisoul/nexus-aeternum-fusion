import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!req.headers.get("authorization")) {
    return new Response(JSON.stringify({ error: "AUTHORIZATION_REQUIRED" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY_NOT_CONFIGURED" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const model = (Deno.env.get("GEMINI_LIVE_MODEL") ?? "gemini-3.8-live").trim();
  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      uses: 1,
      expireTime,
      newSessionExpireTime,
      liveConnectConstraints: {
        model: `models/${model}`,
        config: {
          responseModalities: ["AUDIO"],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body?.name !== "string") {
    console.error("Gemini Live token provisioning failed", response.status, body);
    return new Response(JSON.stringify({
      error: "GEMINI_LIVE_TOKEN_PROVISIONING_FAILED",
      status: response.status,
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    token: body.name,
    model,
    expiresAt: expireTime,
    newSessionExpiresAt: newSessionExpireTime,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
