# N07 Neural Fabric Handoff

N07 is the canonical orchestration/neural service. N03 keeps its native runtime and consumes the shared neural service through Soul Mesh.

Contract: `soul-mesh/1`, `1.1.0`; operations `neural.forward@1.0.0`, `neural.learn@1.0.0`.

Preserve correlationId, bounded finite-number payloads, nonce/HMAC, deadlines and explicit errors. Read current N07 `main` and current bridge SHA before editing because multiple fronts are concurrent.

WHAT_CHANGED: N03 neural-fabric bridge synchronized with the N07 contract.
WHAT_REMAINS: exact-head CI and live bidirectional commissioning.
WHAT_NEXT_AGENT_SHOULD_DO: retain native N03 ownership while validating neural federation against N07; do not fork neural runtime logic.
