import assert from 'node:assert/strict';
import test from 'node:test';
import { createClareiraPacket } from '../../shared/clareira-contract';
import { clareiraMetrics, ingestClareiraPacket, recordClareiraDrop } from './ClareiraBridge';
test('N03 Clareira preserves packet correlation and drop accounting', () => {
  const packet=createClareiraPacket('perception-state','N03','corr-clareira');
  assert.equal(packet.sourceId,'N03');
  assert.equal(packet.correlationId,'corr-clareira');
  assert.equal(ingestClareiraPacket(packet),true);
  const before=clareiraMetrics();
  recordClareiraDrop(packet,'test');
  const after=clareiraMetrics();
  assert.equal(after.packets.dropped,(before.packets.dropped??0)+1);
});
