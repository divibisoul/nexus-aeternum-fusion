# N03 — Hybrid AI Mesh Upgrade

## Evidence used

The upgrade is based on the implementation currently present in this repository, not on endpoint/file presence alone.

- `src/core/NexusCoreProcessor.ts` already defined 11 N03 capabilities, but previously returned dispatch descriptors for most capabilities instead of executing handlers.
- `src/integration/SoulNexusBridge.ts` already consumed Soul Mesh messages through Supabase Realtime, but accepted `target: nexus` while the HTTP contract identifies N03 as `target: N03`.
- `src/soul-mesh/SoulMeshSupabaseTransport.ts` already provided bidirectional broadcast transport.
- `supabase/functions/soul-voice-processing` provides real STT/TTS/emotion operations through OpenAI.
- `supabase/functions/soul-spiritual-wisdom` provides the existing spiritual/frequency/ritual/plant-knowledge runtime. Its general-guidance path is template based rather than an LLM call.
- `src/components/ChatInterface.tsx` contained a hard-coded Google API key and a simulated Gemini call; it did not make the external request despite describing the integration as active.

## New execution path

`Soul Mesh request`

`N01/N02/N04/N05/N06`

→ `N03 Mesh bridge / HTTP gateway`

→ `NexusCoreProcessor`

→ `N03CapabilityBridge`

→ existing capability runtime or `nexus-ai`

→ `Soul Mesh response`

The processor now distinguishes between:

- registered capability;
- executable capability;
- handler execution success;
- handler execution failure.

A capability is no longer considered functional merely because its identifier exists.

## N03 executable capability map

| Capability | Runtime |
|---|---|
| voice-input | `soul-voice-processing` / STT |
| speech-processing | `soul-voice-processing` / STT |
| voice-output | `soul-voice-processing` / TTS |
| emotion-analysis | `soul-voice-processing` |
| spiritual-wisdom | `soul-spiritual-wisdom` |
| plant-knowledge | `soul-spiritual-wisdom` |
| ritual-knowledge | `soul-spiritual-wisdom` |
| frequency-context | `soul-spiritual-wisdom` |
| cognitive-ui | `nexus-ai` |
| multimodal-input | `nexus-ai` |
| mesh-communication | N03 Mesh acknowledgement/transport capability |

## Hybrid provider model

`NexusPilotPort` remains provider-agnostic. If a user-selected pilot is connected, cognitive capabilities can be delegated to it. If no pilot is connected, N03 uses the server-side `nexus-ai` gateway.

The Gemini credential is therefore moved out of the browser runtime. `nexus-ai` reads `GEMINI_API_KEY` from the server environment and calls Gemini's `generateContent` endpoint.

## Important deployment requirement

The repository now contains the code required for the hybrid path, but deployment configuration is still environment-specific:

- configure `GEMINI_API_KEY` as a Supabase Edge Function secret;
- optionally configure `GEMINI_MODEL`;
- configure peer URLs/tokens for N03's outbound HTTP client when the five remote nuclei are deployed;
- configure `SOUL_MESH_GATEWAY_URL` wherever the Vercel-style `api/soul-mesh.ts` adapter is deployed.

Those values are intentionally not committed to the repository.

## What is not claimed

This upgrade does **not** claim that N01–N06 are already E2E connected. The five peer URLs, credentials, and live deployments are external runtime facts and must be tested after configuration.

The correct next verification is therefore capability-by-capability E2E testing, not another static file audit.
