# N03 — Dual Connection + Fusion Handoff

## New execution rule
Each stage must work two compatible connections in parallel. The two branches are then fused before advancing. The sequence remains intentional: N1 → N2 → N3 → N4 → N5 → N6 → N1.

## Implemented
`lib/soul-mesh/N03SynergyOrchestrator.ts` now provides:
- sequential cooperative execution with one correlationId;
- concurrent dual-branch execution using Promise.all;
- branch synergy derived from observed unique capabilities and participating nuclei;
- higher-level fusion of branch outputs;
- `perceptionDualFusion()` composing N03→N02 cognition and N03→N04 action simultaneously.

## Required next-front behavior
Do not treat the numeric fusion value as a hard-coded promise. Recalculate it from the actual agents, tools and capabilities found in GitHub. At every new fusion level, inspect the resulting capability graph for newly possible compositions and implement useful missing capabilities in the existing architecture.

## Next
The next front must verify N02/N04 compatibility with these two N03 branches, then perform the next ordered dual connections without discarding this work.
