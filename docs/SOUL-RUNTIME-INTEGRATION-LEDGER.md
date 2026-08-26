# N03 Runtime Integration Ledger

Canonical runtime endpoint: `/api/soul-mesh` (`api/soul-mesh.ts`).

The endpoint validates Soul Mesh messages and dispatches to the N03 handler layer. This establishes a real server entry point, not merely a route declaration.

E2E status remains deployment-dependent: source presence is not proof of live connectivity.

Required proof: valid channel -> transport -> N03 runtime -> real handler -> correlated response -> capability result.

N03 must preserve all existing perception, multimodal, voice, and context capabilities. AI-dependent functions must consume the externally attached AI provider/session rather than embedding a mandatory provider into the nucleus.
