# N03 ↔ Clareira — Symbiosis Contract

Status: implemented as an additive consumer contract on N03.

## Ownership

N03 keeps ownership of perception/audio/speech capabilities and their native handlers. Clareira remains owned by N01/SARA for neural runtime state and SARA governance. This front does not duplicate either runtime.

## Connection

N03 may consume the SARA operation `sara.clareira.audit` over the existing Soul Mesh/SARA HTTP boundary.

Flow:

N01 Clareira state → SARA canonical ERU freeze → transition audit (MMD adapter) → complementary RGO proposals → ARA/ETR/ITR assessment → `sara.clareira.audit` → N03 consumer.

A returned audit is evidence/metadata, not an authorization to mutate N01, SARA, or N03 state.

## Existing native N03 capabilities preserved

The existing N03 registry remains authoritative for:
- `audio.transcribe`
- `speech.synthesize`
- `audio.analyze.emotion`

Capabilities still marked adapter-required are not promoted by this contract.

## Proof boundary

Static contract presence is E2. Runtime execution, build/typecheck and cross-process E2E remain separate evidence levels and must not be inferred from this document or from route configuration.
