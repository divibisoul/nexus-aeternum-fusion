# N03 Mesh Status

## Closure ledger

N03 is an independent AI nucleus specialized in auditory perception, speech and multimodal perception. Soul Mesh is its interoperability layer; it does not replace the N03 runtime or create a parallel API.

| Area | Implemented | Integrated | Tested | State |
|---|---:|---:|---:|---|
| Identity/protocol | 100% | 100% | structural | CLOSED |
| Five peer relationships | 100% | 100% | live runtime pending | VALIDATION |
| Mesh input | 100% | 100% | runtime pending | VALIDATION |
| Mesh output | 100% | 100% | runtime pending | VALIDATION |
| Agent layer | 100% | 100% | structural | CLOSED |
| Capability registry | 100% | 100% | structural | CLOSED |
| Perception exposer | 100% | 100% | runtime pending | VALIDATION |
| Audio/speech | 100% declared; 3 handlers wired | 100% wired handlers | provider E2E pending | VALIDATION |
| Capability discovery | 100% | 100% | runtime pending | VALIDATION |
| HMAC security boundary | 100% implementation | 100% opt-in by secret | runtime pending | VALIDATION |
| Resilient HTTP/realtime transport | 100% structural | 100% | runtime pending | VALIDATION |
| IA↔IA E2E | 0% proven | 0% | unavailable in this environment | EXTERNAL VALIDATION |

## N03-owned intelligence

Canonical executable audio capabilities are `audio.transcribe`, `audio.analyze.emotion` and `speech.synthesize`. Additional declared capabilities remain contracts until a real runtime handler is supplied; they are not reported as implemented merely because they are listed.

The existing router and agent registry remain authoritative. The Mesh layer delegates execution to those existing handlers instead of duplicating perception or audio engines.

## Mesh topology

N03 has five bidirectional peer relationships: N01, N02, N04, N05 and N06. Registration now targets all five configured peer endpoints. Peer discovery and transport negotiation remain additive.

## Security

N03 now supports HMAC-SHA256 message authentication with timestamp and nonce replay protection when `SOUL_MESH_HMAC_SECRET` is configured. This follows the project-wide HMAC + timestamp + nonce direction. HMAC verification uses constant-time comparison. The implementation uses Node crypto primitives; Web Crypto provides equivalent HMAC sign/verify primitives for browser-side adapters. citeturn0search3turn0search0turn0search1

## Non-destructive rule

No existing N03 audio/perception implementation was deleted. The upgrades are additive and preserve the legacy endpoint and current Gemini adapter.

## Current structural completion

N03 structural implementation is **100% of the currently defined engineering scope** for identity, Mesh, agent routing, capability discovery, security boundary and peer topology. Live E2E commissioning remains an environment-dependent validation activity and does not justify reopening completed architecture.

## Applied commits

- `e631e10fe22ed60f01c634e1fdbe32e0dfeddd65` — hardened Mesh protocol and security fields.
- `1718f2f7c7e4f65715bb85a41ce957ccd5a00061` — completed five-peer registration.
- `608dc7d73d253144adf21814250f1d5587feac84` — added HMAC timestamp/nonce verification.
- `d9f5e101415f7d93619891270ac318f152f4e3a3` — integrated capability discovery and HMAC enforcement.
- `0f964ad578dccd3cae623b489ef3af7084621663` — completed security/topology environment configuration.
