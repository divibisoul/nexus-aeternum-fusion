import assert from "node:assert/strict";
import test from "node:test";
import { PerceptionModule } from "./PerceptionModule";

test("M5 exposes the real N03 capability inventory", () => {
  const module = new PerceptionModule();
  const capabilities = module.capabilities();
  assert.ok(capabilities.some(item => item.id === "audio.transcribe"));
  assert.ok(capabilities.some(item => item.id === "speech.synthesize"));
});

test("M5 never fabricates perception output when its runtime handler is not bound", async () => {
  const module = new PerceptionModule();
  const result = await module.handle({
    type: "audio.transcribe",
    payload: { source: "test" },
    correlationId: "test-correlation",
  });
  assert.equal(result.capability, "audio.transcribe");
  assert.equal(result.status, "handler_not_bound");
  assert.equal(result.result, undefined);
});
