import test from 'node:test';
import assert from 'node:assert/strict';
import { delegateN03ExternalCapability } from './N03ExternalCapabilityBridge';

test('N03 external capability bridge requires correlation', async () => {
  await assert.rejects(
    delegateN03ExternalCapability({
      capability: 'strategic_planning',
      payload: {},
      correlationId: ' ',
    }),
    /N03_EXTERNAL_CORRELATION_REQUIRED/,
  );
});
