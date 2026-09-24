import test from 'node:test';
import assert from 'node:assert/strict';

test('N03 forwards platform-neutral SARA context through the real Mesh handler', async () => {
  process.env.NODE_ENV = 'test';
  process.env.SARA_SERVICE_URL = 'http://sara.test';
  process.env.SARA_SERVICE_TOKEN = 'token';
  const original = globalThis.fetch;
  let saraBody: any = null;
  globalThis.fetch = async (_input, init) => {
    saraBody = JSON.parse(String(init?.body ?? '{}'));
    return new Response(JSON.stringify({
      cycle_id: 'n03-cycle',
      final_state: 'validated',
      correlation_id: 'n03-corr',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'X-Correlation-ID': 'n03-corr' },
    });
  };

  try {
    const { default: handler } = await import('./soul-mesh');
    let responseBody: any = null;
    let statusCode = 0;
    const res = {
      status(code: number) { statusCode = code; return this; },
      json(body: any) { responseBody = body; return body; },
    };

    await handler({
      method: 'POST',
      body: {
        protocol: 'soul-mesh/1',
        contractVersion: '1.1.0',
        id: 'n03-message',
        correlationId: 'n03-corr',
        source: 'N01',
        target: 'N03',
        kind: 'request',
        capability: 'sara.cycle',
        payload: {
          input: 'validar percepção',
          cycle_id: 'n03-cycle',
          context: {
            session_id: 'n03-session',
            client: 'app',
            probabilistic: { nodes: [] },
          },
        },
        timestamp: Date.now(),
      },
    }, res);

    assert.equal(statusCode, 200);
    assert.equal(saraBody.context.client, 'app');
    assert.deepEqual(saraBody.context.probabilistic.nodes, []);
    assert.equal(responseBody.payload.cycle_id, 'n03-cycle');
  } finally {
    globalThis.fetch = original;
  }
});
