import { afterEach, describe, expect, test } from 'bun:test';
import { describeWhisperAdapter, transcribeWithWhisper } from './WhisperAdapter';

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe('Whisper adapter boundary', () => {
  test('does not claim execution when the adapter is disabled', async () => {
    delete process.env.SOUL_N03_WHISPER_ENABLED;
    const state = describeWhisperAdapter();
    expect(state.state).toBe('DEGRADED');
    expect(state.code).toBe('WHISPER_ADAPTER_DISABLED');

    const result = await transcribeWithWhisper({ data: 'dGVzdA==', mimeType: 'audio/wav' });
    expect(result.state).toBe('DEGRADED');
    expect(result.code).toBe('WHISPER_ADAPTER_DISABLED');
  });

  test('enabled adapter with missing local weights remains DEGRADED', () => {
    process.env.SOUL_N03_WHISPER_ENABLED = 'true';
    process.env.SOUL_N03_WHISPER_ROOT = 'integrations/soul-upstream/whisper';
    process.env.SOUL_N03_WHISPER_MODEL_PATH = '/definitely/missing/whisper-model.pt';
    const state = describeWhisperAdapter();
    expect(state.state).toBe('DEGRADED');
    expect(state.code).toBe('WHISPER_MODEL_NOT_AVAILABLE');
  });
});
