import { afterEach, describe, expect, test } from 'bun:test';
import { describeKokoroAdapter, synthesizeWithKokoro } from './KokoroAdapter';

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe('Kokoro adapter boundary', () => {
  test('does not claim execution while disabled', async () => {
    delete process.env.SOUL_N03_KOKORO_ENABLED;
    const state = describeKokoroAdapter();
    expect(state.state).toBe('DEGRADED');
    expect(state.code).toBe('KOKORO_ADAPTER_DISABLED');

    const result = await synthesizeWithKokoro({ text: 'teste', voice: 'af_heart' });
    expect(result.state).toBe('DEGRADED');
    expect(result.code).toBe('KOKORO_ADAPTER_DISABLED');
  });

  test('enabled adapter with missing source remains DEGRADED', () => {
    process.env.SOUL_N03_KOKORO_ENABLED = 'true';
    process.env.SOUL_N03_KOKORO_ROOT = '/definitely/missing/kokoro';
    process.env.SOUL_N03_KOKORO_VOICE = 'af_heart';
    const state = describeKokoroAdapter();
    expect(state.state).toBe('DEGRADED');
    expect(state.code).toBe('KOKORO_SOURCE_NOT_AVAILABLE');
  });

  test('configured source is not promoted before a real synthesis', () => {
    process.env.SOUL_N03_KOKORO_ENABLED = 'true';
    process.env.SOUL_N03_KOKORO_ROOT = process.cwd();
    process.env.SOUL_N03_KOKORO_VOICE = 'af_heart';
    const state = describeKokoroAdapter();
    expect(state.state).toBe('DEGRADED');
    expect(state.code).toBe('KOKORO_EXECUTION_NOT_YET_PROVEN');
  });
});
