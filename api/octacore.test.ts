import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './soul-mesh';

function invoke(body: unknown) {
  process.env.NODE_ENV = 'test';
  const req: any = { method: 'POST', headers: {}, body };
  let statusCode = 200;
  let payload: any;
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { payload = value; return this; },
  };
  return Promise.resolve(handler(req, res)).then(() => ({ status: statusCode, payload }));
}

test('G3 Octacore wrapper executes the canonical Mesh ping kernel', async () => {
  const correlationId = 'g3-octa-cert-001';
  const result = await invoke({
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'g3-msg-001',
    correlationId,
    source: 'N07',
    target: 'N03',
    kind: 'request',
    capability: 'octacore.execute',
    payload: {
      capability: 'mesh.ping',
      payload: { certification: true },
      job_id: 'g3-job-001',
    },
    timestamp: Date.now(),
  });
  assert.equal(result.status, 200);
  assert.equal(result.payload.correlationId, correlationId);
  assert.equal(result.payload.payload.kernel, 'G3');
  assert.equal(result.payload.payload.value.ok, true);
});

test('G3 Octacore wrapper rejects undeclared execution deterministically', async () => {
  const result = await invoke({
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'g3-msg-002',
    correlationId: 'g3-octa-cert-002',
    source: 'N07',
    target: 'N03',
    kind: 'request',
    capability: 'octacore.execute',
    payload: { capability: 'not-a-real-capability', payload: {} },
    timestamp: Date.now(),
  });
  assert.equal(result.status, 501);
  assert.equal(result.payload.payload.code, 'OCTACORE_N03_CAPABILITY_NOT_EXECUTABLE');
});
