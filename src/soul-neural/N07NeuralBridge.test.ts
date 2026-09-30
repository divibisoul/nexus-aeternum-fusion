import { strict as assert } from "node:assert";
import test from "node:test";
import { N07NeuralBridge, type NeuralParameters } from "./N07NeuralBridge";

test("N03 can consume the canonical N07 neural parameter contract", async () => {
  const originalFetch = globalThis.fetch;
  const parameters: NeuralParameters = {
    size: 8, learning_rate: 0.05, optimizer: "adam", regularization: 0.000001,
    gradient_clip: 1, heads: 1, batch_cache: 128, layers: [{ activation: "tanh", dropout_rate: 0 }]
  };
  globalThis.fetch = async () => new Response(JSON.stringify({
    contractVersion: "1.1.0",
    id: "msg-parameters",
    correlationId: "corr-parameters",
    status: "ok",
    payload: {},
    metadata: { parameters: JSON.stringify(parameters) }
  }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const bridge = new N07NeuralBridge("N03", { baseUrl: "http://n07.test" });
    const actual = await bridge.parameters("corr-parameters");
    assert.deepEqual(actual, parameters);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
