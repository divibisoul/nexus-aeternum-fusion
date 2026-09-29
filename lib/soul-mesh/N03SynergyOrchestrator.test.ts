import { describe, expect, it } from 'vitest';
import { N03SynergyOrchestrator } from './N03SynergyOrchestrator';

describe('N03 composition contract', () => {
  it('routes reasoning to the current N05 inference owner', async () => {
    const calls: Array<{ target: string; capability: string; payload: unknown }> = [];
    const fakePeer = {
      request: async (target: string, capability: string, payload: unknown) => {
        calls.push({ target, capability, payload });
        return { payload: { ok: true } };
      },
    };

    const orchestrator = new N03SynergyOrchestrator(fakePeer as never);
    await orchestrator.perceptionToReasoning({ text: 'audio evidence' });

    expect(calls[0]).toMatchObject({ target: 'N05', capability: 'inference.reason' });
  });

  it('does not fabricate an N04 tool request without an executable tool payload', async () => {
    const orchestrator = new N03SynergyOrchestrator({ request: async () => ({ payload: {} }) } as never);
    await expect(orchestrator.perceptionToExecution({ text: 'evidence' }))
      .rejects.toThrow('N03_EXECUTABLE_TOOL_PAYLOAD_REQUIRED');
  });

  it('preserves an explicit N04 tool payload for composition', async () => {
    const calls: Array<{ target: string; capability: string; payload: unknown }> = [];
    const fakePeer = {
      request: async (target: string, capability: string, payload: unknown) => {
        calls.push({ target, capability, payload });
        return { payload: { ok: true } };
      },
    };
    const orchestrator = new N03SynergyOrchestrator(fakePeer as never);
    const toolPayload = { tool: 'getWeather', arguments: { latitude: 0, longitude: 0 } };

    await orchestrator.perceptionReasoningExecution({ text: 'evidence' }, toolPayload);

    expect(calls.map(call => [call.target, call.capability])).toEqual([
      ['N05', 'inference.reason'],
      ['N04', 'tool.execute'],
    ]);
    expect(calls[1].payload).toEqual(toolPayload);
  });
});
