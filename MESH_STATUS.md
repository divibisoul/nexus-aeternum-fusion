# N03 Mesh Status

## Closure ledger

N03 is an independent AI nucleus specialized in auditory perception and speech. Soul Mesh is its interoperability layer; it does not replace the N03 runtime or create a parallel API.

| Area | Implemented | Integrated | Tested | Evidence | State |
|---|---:|---:|---:|---|---|
| Identity/protocol | 100% | 100% | 100% | `src/mesh/SoulMeshProtocol.ts`, `lib/soul-mesh/endpoint.ts` | CLOSED |
| Five peer channels | 100% | 100% | 0% live | channel contract | VALIDATION |
| Mesh input | 100% | 100% | 0% live | `SoulMeshRouter`/endpoint | VALIDATION |
| Mesh output | 100% | 100% | 0% live | `SoulMeshPeerClient` | VALIDATION |
| Agent layer | 100% | 100% | 0% live | `SoulMeshAgentRegistry`, `SoulMeshRouter` | VALIDATION |
| Capability registry | 100% | 100% | 0% live | `SoulMeshCapabilityRegistry` | VALIDATION |
| Perception exposer | 100% | 100% | 0% live | `SoulMeshCapabilityExposer.ts` | VALIDATION |
| Audio/speech capabilities | 100% declared; 3 wired | 100% for wired handlers | 0% provider E2E | capability contracts | VALIDATION |
| Discovery | 100% structural | 100% configured | 0% live | peer/discovery modules | VALIDATION |
| Resilient transport | 100% structural | 100% | 0% live | HTTP transport | VALIDATION |
| Ownership | 100% documented | 100% | 0% E2E | `N03CapabilityOwnership.md` | CLOSED |
| IA↔IA E2E | 0% proven | 0% | 0% | no live multi-node run | BLOCKED BY RUNTIME |
| CI | configured | — | pending current run | package scripts/workflow | VALIDATION |

## K6 topology

N03 has five bidirectional peer relationships: N01, N02, N04, N05 and N06. Each relationship has an inbound and outbound logical channel.

## Executable capability boundary

The canonical exposer binds only handlers actually supplied by the existing N03 perception implementation. It does not invent or duplicate implementations. The registry keeps declaration separate from execution so discovery cannot be interpreted as proof of runtime support.

Current canonical perception mappings:
- `perception.analyzeImage`
- `perception.processAudio`
- `perception.analyzeMultimodal`

The existing audio/speech surface remains authoritative for N03-specific runtime capabilities. Capabilities without a real runtime adapter remain contracts rather than false-positive implementations.

## No destructive changes

No existing N03 implementation is deleted or invalidated. New Mesh integration is additive. The legacy endpoint remains preserved.

## Closure rule

N03 is not declared fully closed until live peer execution proves request → capability execution → response with matching correlation ID for the required N03 peer relationships and CI is green. HTTP 200, ping, file presence, or declarations alone do not count as E2E proof.

## Latest correction

- Commit: `e02b19bd95b13aa73b822089feddca039c556a60`
- Added missing `SoulMeshCapabilityExposer.ts` required by `N03PerceptionCapabilities.ts`.
- Existing implementations are injected; no duplicate perception engine was created.
