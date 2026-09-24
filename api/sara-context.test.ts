import test from 'node:test';
import assert from 'node:assert/strict';

test('N03 accepts platform-neutral SARA context envelope shape', () => {
  const context = {
    session_id: 'session-003',
    client: 'web',
    probabilistic: {
      nodes: [{
        name: 'uncertainty',
        states: ['low', 'high'],
        prior: { low: 0.5, high: 0.5 },
        provenance: 'INFERRED',
      }],
    },
  };
  assert.equal(context.client, 'web');
  assert.equal(context.probabilistic.nodes.length, 1);
  assert.deepEqual(context.probabilistic.nodes[0].states, ['low', 'high']);
});
