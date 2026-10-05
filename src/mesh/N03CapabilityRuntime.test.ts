import assert from 'node:assert/strict';
import test from 'node:test';
import { N03CapabilityRuntime } from './N03CapabilityRuntime';

test('N03 audio.transcribe validates input before provider execution', async () => {
  const runtime = new N03CapabilityRuntime({ peerClient: { request: async () => { throw new Error('unexpected'); } } });
  await assert.rejects(
    runtime.execute('audio.transcribe', { mimeType: 'audio/wav', data: '' }),
    /AUDIO_DATA_AND_MIME_TYPE_REQUIRED/,
  );
});

test('N03 audio.transform identity preserves the supplied payload', async () => {
  const runtime = new N03CapabilityRuntime({ peerClient: { request: async () => { throw new Error('unexpected'); } } });
  const result = await runtime.execute('audio.transform', {
    mimeType: 'audio/wav',
    data: Buffer.from('RIFF-test').toString('base64'),
    operation: 'identity',
  }) as Record<string, unknown>;

  assert.equal(result.transformed, false);
  assert.equal(result.operation, 'identity');
  assert.equal(result.targetMimeType, 'audio/wav');
});

test('N03 audio.transform delegates document artifacts to N04 with correlation', async () => {
  let observed: unknown[] = [];
  const runtime = new N03CapabilityRuntime({
    peerClient: {
      request: async (target, capability, payload, correlationId) => {
        observed = [target, capability, payload, correlationId];
        return {
          protocol: 'soul-mesh/1',
          contractVersion: '1.1.0',
          id: 'n04-response',
          correlationId: correlationId ?? 'generated-correlation',
          source: 'N04',
          target: 'N03',
          kind: 'response',
          capability: 'artifact.analyze',
          payload: { analyzed: true },
          timestamp: Date.now(),
        };
      },
    },
  });

  const result = await runtime.execute('audio.transform', {
    mimeType: 'application/octet-stream',
    data: 'AQID',
    correlationId: 'corr-n03-n04-1',
    artifact: { kind: 'document', filename: 'test.md', content: '# test' },
  }) as Record<string, unknown>;

  assert.equal(observed[0], 'N04');
  assert.equal(observed[1], 'artifact.analyze');
  assert.deepEqual(observed[2], { kind: 'document', filename: 'test.md', content: '# test' });
  assert.equal(observed[3], 'corr-n03-n04-1');
  assert.equal(result.mode, 'delegated-document-artifact');
  assert.deepEqual(result.result, { analyzed: true });
});
