# N03 Mesh Status

## Role
N03 is the Soul auditory/speech nucleus. Its Mesh endpoint exposes N03 capabilities to N01, N02, N04, N05 and N06.

## K6 topology
N03 has five bidirectional peer relationships. Each peer has an N03 IN channel and an N03 OUT channel:

- N01 ↔ N03: `N03.IN.N01` / `N03.OUT.N01`
- N02 ↔ N03: `N03.IN.N02` / `N03.OUT.N02`
- N04 ↔ N03: `N03.IN.N04` / `N03.OUT.N04`
- N05 ↔ N03: `N03.IN.N05` / `N03.OUT.N05`
- N06 ↔ N03: `N03.IN.N06` / `N03.OUT.N06`

The N03 endpoint accepts requests from N01/N02/N04/N05/N06 and emits responses addressed to the originating peer. This establishes the N03 side of the K6 topology without changing any other nucleus.

## Structurally closed components
- Mesh protocol identity: `N03`, `soul-mesh/1`, v1.1.0.
- Peer validation and 5 IN / 5 OUT channel model.
- HTTP endpoint → `SoulMeshRouter` → capability handler → response chain.
- Resilient HTTP transport with retry, exponential backoff and circuit-breaker state.
- Peer discovery foundation.
- Automatic N03 registration attempts to N01 and N02 with retry/backoff when URLs are configured.
- Gemini adapter using `GEMINI_API_KEY` or `GOOGLE_API_KEY` from runtime environment.
- `audio.transcribe`, `speech.synthesize`, and `audio.analyze.emotion` are wired to Gemini adapter functions.
- `mesh.ping` and `mesh.describe` remain available for compatibility/diagnostics.
- README and this status ledger updated.
- `npm run typecheck` is now explicitly defined in package scripts.

## Capability status
| Capability | Structural state | Runtime provider |
|---|---|---|
| audio.transcribe | IMPLEMENTED | Gemini audio understanding |
| speech.synthesize | IMPLEMENTED | Gemini TTS |
| audio.analyze.emotion | IMPLEMENTED | Gemini audio understanding |
| speech.translate | CONTRACT | adapter/runtime pipeline pending |
| audio.summarize | CONTRACT | AI runtime pending |
| audio.listen.continuous | CONTRACT | device/browser runtime pending |
| audio.denoise | CONTRACT | DSP/runtime pending |
| speaker.identify | CONTRACT | model/runtime pending |

## Runtime validation pending
The following require deployed/running peers and valid runtime credentials and are intentionally not marked PASS here:

- N01 ↔ N03 live communication.
- N02 ↔ N03 live communication.
- N04 ↔ N03 live communication.
- N05 ↔ N03 live communication.
- N06 ↔ N03 live communication.
- Real audio transcription/TTS/emotion execution against the provider.

This is a validation gate, not a construction blocker. The structural implementation remains deployable and can be validated when the nuclei are running.

## CI
The repository now exposes `npm run typecheck` and `npm run build`. CI status must be taken from the GitHub Actions run for the current commit; no green result is claimed until GitHub reports it.

## Latest structural upgrade
- Date: 2026-08-27
- Latest structural commit: `b8edd0aea0c04f6b74096046c834d466b58eaf87`
- Scope: N03 only
- N01/N02/N04/N05/N06 modified: no
