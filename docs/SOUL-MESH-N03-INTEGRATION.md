# N03 Soul Mesh Integration

N03 remains an independent cognitive/application nucleus. Soul Mesh is an interoperability boundary, not a replacement for N03 capabilities.

## Canonical contract

`soul-mesh/1` with N01-N06 identities, request/response/event/error/ack kinds, correlationId and epoch-millisecond timestamp.

## Peer endpoints

Configure `SOUL_MESH_N01_URL`, `SOUL_MESH_N02_URL`, `SOUL_MESH_N04_URL`, `SOUL_MESH_N05_URL`, and `SOUL_MESH_N06_URL` in the deployment environment. No endpoint is hard-coded or assumed reachable.

## Verification sequence

1. `mesh.ping`
2. `mesh.describe`
3. `capability.list`
4. capability execution only when `executable=true`
5. verify source/target/correlationId on response

A configured endpoint is not evidence of connectivity; deployment-level E2E tests must pass before a peer is marked online.
