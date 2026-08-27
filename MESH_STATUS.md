# N03 Mesh Status

## Role
N03 is the Soul auditory/speech nucleus. Its Mesh adapter exposes the N03 runtime and audio/speech capability contracts to N01, N02, N04, N05 and N06.

## Protocol
- Protocol: `soul-mesh/1`
- Mesh version: `1.1.0`
- Identity: `N03`
- IN peers: N01, N02, N04, N05, N06
- OUT peers: N01, N02, N04, N05, N06

## Implemented foundation
- Protocol identity and message validation.
- Peer origin/destination validation.
- HTTP transport with retry, exponential backoff and circuit-breaker state.
- Request/response router.
- Browser peer persistence using local storage as a safe fallback until Supabase/IndexedDB discovery is wired into the runtime.
- Audio/speech capability registry.

## Audio capability contract
| Capability | Status | Provider/runtime |
|---|---|---|
| audio.transcribe | implemented contract | Google Cloud Speech / Hugging Face |
| speech.synthesize | implemented contract | Google Cloud Text-to-Speech |
| audio.analyze.emotion | adapter-required | Hugging Face |
| speech.translate | adapter-required | Speech + translation runtime |
| audio.summarize | adapter-required | AI runtime |
| audio.listen.continuous | adapter-required | Device/browser audio runtime |
| audio.denoise | adapter-required | Audio DSP/runtime |
| speaker.identify | adapter-required | Speaker recognition runtime |

## Important validation status
The existing API endpoint currently supports the legacy `mesh.ping` and `mesh.describe` handlers. The new `src/mesh` foundation is additive and does not claim runtime E2E success until the application server and provider credentials are available.

No other nucleus was modified by this upgrade.
