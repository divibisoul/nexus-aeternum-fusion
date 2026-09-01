# N03 → N07 Neural Federation

N03 exposes neural workloads through `src/soul-neural/N07NeuralBridge.ts`. The bridge uses the canonical Soul Mesh contract `1.1.0`, HMAC-SHA256, correlation, nonce, timeout and numeric validation for `neural.forward@1.0.0` and `neural.learn@1.0.0`.

N03-specific execution remains local; shared neural processing is delegated to N07 without duplicating the N07 neural runtime.
