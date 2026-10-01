# N07 Neural Fabric Handoff

N07 is the canonical orchestration/neural service. N03 keeps its native runtime and consumes the shared neural service through Soul Mesh.

Contract: `soul-mesh/1`, `1.1.0`; operations `neural.forward@1.0.0`, `neural.learn@1.0.0`.

Preserve correlationId, bounded finite-number payloads, nonce/HMAC, deadlines and explicit errors. Read current N07 `main` and current bridge SHA before editing because multiple fronts are concurrent.

WHAT_CHANGED: N03 neural-fabric bridge synchronized with the N07 contract.
WHAT_REMAINS: exact-head CI and live bidirectional commissioning.
WHAT_NEXT_AGENT_SHOULD_DO: retain native N03 ownership while validating neural federation against N07; do not fork neural runtime logic.


## Orbital reasoning / Prefrontal consumer contract — 2026-10-01

This nucleus remains the owner of its native agents and tools. It may consume the N07 canonical capabilities through the existing Soul Mesh when the runtime needs resource simulation or risk-bearing admission:

- `transcendental.estimate@1.0.0` — N07 TCE deterministic resource simulation; simulation evidence only, never physical-hardware evidence.
- `prefrontal.orbital.evaluate@1.0.0` — N07 TCE evidence combined with the canonical Prefrontal admission boundary.

The local agent/tool must preserve the existing `correlationId`, `traceId`, Mesh authentication/deadline contract and its own ownership. This is a consumer path, not a copied TCE/Prefrontal runtime.
