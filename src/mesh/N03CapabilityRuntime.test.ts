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

test('N03 document artifact delegation does not require an audio payload', async () => {
  let called = false;
  const runtime = new N03CapabilityRuntime({
    peerClient: {
      request: async (target, capability, payload) => {
        called = target === 'N04' && capability === 'artifact.analyze' && Boolean(payload);
        return {
          protocol: 'soul-mesh/1',
          contractVersion: '1.1.0',
          id: 'n04-response-2',
          correlationId: 'generated-document-correlation',
          source: 'N04',
          target: 'N03',
          kind: 'response',
          capability: 'artifact.analyze',
          payload: { analyzed: true, standalone: true },
          timestamp: Date.now(),
        };
      },
    },
  });

  const result = await runtime.execute('audio.transform', {
    correlationId: 'corr-n03-doc-only',
    artifact: { kind: 'document', filename: 'document.md', content: '# document' },
  }) as Record<string, unknown>;

  assert.equal(called, true);
  assert.equal(result.mode, 'delegated-document-artifact');
});

test('N03 dispatches implemented audio capabilities through the Gemini adapter using a contract-valid unit fixture', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-runtime-key';
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const requestBody = JSON.parse(String(init?.body ?? '{}')) as {
      generationConfig?: { responseModalities?: string[] };
    };
    const requestsAudio = requestBody.generationConfig?.responseModalities?.includes('AUDIO') ?? false;
    const parts = requestsAudio
      ? [{ inlineData: { mimeType: 'audio/wav', data: Buffer.from('unit-test-audio-fixture').toString('base64') } }]
      : [{ text: init?.body && String(init.body).includes('Translate') ? 'translated' : 'analysis' }];
    const body = JSON.stringify({ candidates: [{ content: { parts } }] });
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const runtime = new N03CapabilityRuntime({ peerClient: { request: async () => { throw new Error('unexpected'); } } });
    const audio = { mimeType: 'audio/wav', data: Buffer.from('RIFF-test').toString('base64'), correlationId: 'corr-n03-audio-coverage' };

    const emotion = await runtime.execute('audio.analyze.emotion', audio) as Record<string, unknown>;
    const summary = await runtime.execute('audio.summarize', audio) as Record<string, unknown>;
    const translation = await runtime.execute('speech.translate', { ...audio, targetLanguage: 'English' }) as Record<string, unknown>;
    const speakers = await runtime.execute('speaker.identify', audio) as Record<string, unknown>;
    const synthesis = await runtime.execute('speech.synthesize', { text: 'hello', voice: 'Kore', correlationId: audio.correlationId }) as Record<string, unknown>;

    assert.equal(emotion.provider, 'gemini');
    assert.equal(summary.provider, 'gemini');
    assert.equal(translation.provider, 'gemini');
    assert.equal(speakers.provider, 'gemini');
    assert.equal(synthesis.provider, 'gemini');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
