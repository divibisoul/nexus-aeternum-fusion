# N03 — Public upstream integration status
**Snapshot:** 2026-10-25 · **Inspected N03 main:** `3325cfa8960f4624a5e00d691edb6e0e92f4b3ef`  
**Audit branch:** `audit/ai-nucleus-status-2026-10-25`

## Sources pinned

| Public source | Pinned SHA | N03 function | State |
|---|---|---|---|
| [AgentScope](https://github.com/agentscope-ai/agentscope) | `72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6` | Multimodal/voice-agent assistance | SOURCE_PINNED; no N03 agent-run transaction proven |
| [Whisper](https://github.com/openai/whisper) | `86098128c0b4f24f0e2aa2994de830614b474227` | Local speech-to-text | Adapter + runner exist; runtime gated on enablement, source, weight file and dependencies |
| [Kokoro](https://github.com/hexgrad/kokoro) | `dfb907a02bba8152ca444717ca5d78747ccb4bec` | Local text-to-speech | Adapter + runner exist; current adapter descriptor still reports execution unproven |

N03 owns audio perception and speech. The upstream models augment this specialty; none is a substitute for the native Gemini/audio-transform paths or canonical Mesh.

## Existing executable adapter evidence and gaps

- `src/mesh/WhisperAdapter.ts` validates `SOUL_N03_WHISPER_ENABLED`, source root and model-path presence; the Python runner checks audio input, ffmpeg, model load and transcription. A real transcription must return non-empty text against a fixture before `RUNTIME_VERIFIED`.
- `src/mesh/KokoroAdapter.ts` and `scripts/kokoro_runner.py` carry the pinned revision and synthesis implementation. However `describeKokoroAdapter()` remains `DEGRADED / KOKORO_EXECUTION_NOT_YET_PROVEN` if enabled/source present. Do not report synthesis ready until the output audio payload is validated and a real synthesis run passes.
- `src/mesh/N03AudioCapabilityRegistry.ts` marks four capabilities `adapter-required`, including continuous listening, denoising, Whisper and Kokoro. Maintain those incomplete states until tested; do not call a catalog entry an active capability.
- AgentScope’s generic N07 runner imports from active Python environment rather than ensuring the Python package matches the pinned upstream source. If N03 eventually uses the generic runner, require isolated package/version proof.

## Next test sequence

1. Run exact-head package install, typecheck, HMAC/listener/pair-fusion tests.
2. Test native `audio.transform` through N07 Mesh with signed response and preserved correlation.
3. Test Whisper and Kokoro separately only when their source/model/dependency prerequisites actually exist. Classify missing setup as `BLOCKED_ENV` only for that specific path.
4. Keep AgentScope `adapter-planned` until a real bounded voice/multimodal agent transaction returns through Mesh.

**Gate:** Whisper/Kokoro have structural adapters, but all three public sources remain runtime-unverified in this audit.


## Latest structural validation

The isolated N03 validation workflow passed on SHA `22ba7066442bb64cdca72cd5858ace7e63bc74f4`: [GitHub Actions run 40192359891](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/40192359891). It completed Mesh typecheck, Whisper/Kokoro/registry tests, native runtime tests, pair-fusion, endpoint, HMAC, listener smoke and build steps. This validates the tested guardrails at that branch head; no real provider transcription/synthesis or production Mesh transaction was executed.
