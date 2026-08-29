# N03 → N02/N04 handoff

## Completed
- Added `lib/soul-mesh/N03SynergyOrchestrator.ts`.
- N03 now has an additive composition layer for its perception/audio specialization with N02 reasoning and N04 execution.
- Uses the existing `SoulMeshPeerClient`; no second Mesh or parallel transport was created.
- Preserves Mesh `correlationId` through multi-step composition.

## Active pair sequence
- N03 ↔ N02: perception/audio evidence can be delegated to N02 inference/reasoning.
- N03 ↔ N04: perception output can be delegated to N04 tool execution.
- Combined composition: N03 → N02 → N04, so perception feeds reasoning and reasoning feeds execution.

## Compatibility requirement
The next front must verify the exact executable capability IDs exposed by N02/N04 before expanding the composition. If a capability is declared but not executable, wire the existing runtime/agent rather than inventing a duplicate implementation.

## Next consumer
N02 front: consume N03 perception output as cognitive input and expose a verified executable reasoning capability through the existing Mesh.
N04 front: consume N03-derived reasoning/perception context through the existing tool/document runtime and return correlated results.

## Validation status
Structural implementation committed. Live cross-process E2E remains environment-dependent and must not be represented as proven until runtime commissioning succeeds.

## Commit
`11472897add2a99ed399815094be4f52b9e510b1`
