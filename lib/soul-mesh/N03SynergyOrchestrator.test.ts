import { describe, expect, it } from 'bun:test';
import { N03SynergyOrchestrator } from './N03SynergyOrchestrator';
import type { SoulMeshPeerClient } from './SoulMeshPeerClient';

describe('N03SynergyOrchestrator', () => {
  it('preserves one correlation id across delegated Mesh steps', async () => {
    const calls: Array<{ target: string; capability: string; correlationId?: string; payload: unknown }> = [];
    const fakePeers = {
      request: async (target: string, capability: string, payload: unknown, correlationId?: string) => {
        calls.push({ target, capability, correlationId, payload });
        return {
          protocol: 'soul-mesh/1',
          contractVersion: '1.1.0',
          id: 'response-1',
          correlationId: correlationId ?? 'missing',
          source: target,
          target: 'N03',
          kind: 'response',
          capability,
          payload: { ok: true },
          timestamp: Date.now(),
        };
      },
    } as unknown as SoulMeshPeerClient;

    const sut = new N03SynergyOrchestrator(fakePeers);
    const result = await sut.execute([
      { target: 'N02', capability: 'inference.reason', payload: { perception: 'hello' } },
      { target: 'N04', capability: 'tool.execute', payload: { tool: 'getWeather', arguments: { city: 'São Paulo' } } },
    ], 'corr-n03-test');

    expect(result.correlationId).toBe('corr-n03-test');
    expect(calls.map(call => call.correlationId)).toEqual(['corr-n03-test', 'corr-n03-test']);
    expect(calls[1]?.payload).toEqual({
      input: { tool: 'getWeather', arguments: { city: 'São Paulo' } },
      previous: { ok: true },
      correlationId: 'corr-n03-test',
    });
  });

  it('rejects an undeclared N04 tool before reaching Mesh', async () => {
    const fakePeers = {
      request: async () => { throw new Error('NETWORK_SHOULD_NOT_BE_CALLED'); },
    } as unknown as SoulMeshPeerClient;
    const sut = new N03SynergyOrchestrator(fakePeers);

    await expect(sut.executeToolOnN04({ tool: 'deleteEverything' as never })).rejects.toThrow('N04_TOOL_NOT_DECLARED:deleteEverything');
  });
});