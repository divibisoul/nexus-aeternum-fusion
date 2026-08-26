import { describe, expect, it } from 'vitest';
import { createResponse, describeCapabilities, handleMeshMessage, validateMeshMessage } from './endpoint';

const request = (overrides: Record<string, unknown> = {}) => ({
  protocol: 'soul-mesh/1', id: 'm-1', correlationId: 'c-1', source: 'N01', target: 'N03',
  kind: 'request', capability: 'cognitive-ui', payload: { text: 'hello' }, timestamp: Date.now(), ...overrides,
});

describe('N03 Soul Mesh contract', () => {
  it('accepts a valid inter-nucleus request', () => expect(() => validateMeshMessage(request())).not.toThrow());
  it('rejects self-routing', () => expect(() => validateMeshMessage(request({ source: 'N03' }))).toThrow('INVALID_NUCLEUS_ROUTE'));
  it('rejects stale messages', () => expect(() => validateMeshMessage(request({ timestamp: Date.now() - 301000 }))).toThrow('MESSAGE_TIMESTAMP_OUT_OF_WINDOW'));
  it('executes a registered capability and preserves correlation', async () => {
    const result = await handleMeshMessage(request(), { 'cognitive-ui': async (payload) => ({ echoed: payload }) });
    expect(result.kind).toBe('response');
    expect(result.source).toBe('N03');
    expect(result.target).toBe('N01');
    expect(result.correlationId).toBe('c-1');
    expect(result.payload).toEqual({ ok: true, result: { echoed: { text: 'hello' } } });
  });
  it('returns a typed error for an unregistered capability', async () => {
    const result = await handleMeshMessage(request({ capability: 'does.not.exist' }), {});
    expect(result.kind).toBe('error');
    expect(result.correlationId).toBe('c-1');
  });
  it('exposes only registered capabilities', () => expect(describeCapabilities({ a: () => 1, b: () => 2 }).capabilities).toEqual(['a', 'b']));
  it('creates a response back to the originating nucleus', () => {
    const result = createResponse(request(), 'response', { ok: true });
    expect(result.source).toBe('N03');
    expect(result.target).toBe('N01');
    expect(result.correlationId).toBe('c-1');
  });
});
