import { describe, expect, it } from 'vitest';
import { N03SynergyOrchestrator } from './N03SynergyOrchestrator';

describe('N03 composition contract', () => {
  it('routes perception reasoning to the canonical N02 inference owner', async () => {
    const calls: Array<{ target: string; capability: string; payload: unknown }> = [];
    const fakePeer = {
      request: async (target: string, capability: string, payload: unknown, correlationId?: string) => {
        calls.push({ target, capability, payload, correlationId } as never);
        return { payload: { ok: true } };
      },
    };

    const orchestrator = new N03SynergyOrchestrator(fakePeer as never);
    await orchestrator.perceptionToReasoning({ text: 'audio evidence' });

    expect(calls[0]).toMatchObject({ target: 'N02', capability: 'inference.reason' });
    expect((calls[0] as any).correlationId).toBeTypeOf('string');
  });

  it('rejects undeclared N04 tools instead of fabricating execution', async () => {
    const orchestrator = new N03SynergyOrchestrator({ request: async () => ({ payload: {} }) } as never);
    await expect(orchestrator.perceptionToExecution({ tool: 'not-real-tool' } as never))
      .rejects.toThrow('N04_TOOL_NOT_DECLARED');
  });

  it('preserves an explicit N04 tool payload for composition', async () => {
    const calls: Array<{ target: string; capability: string; payload: unknown }> = [];
    const fakePeer = {
      request: async (target: string, capability: string, payload: unknown, correlationId?: string) => {
        calls.push({ target, capability, payload, correlationId } as never);
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

it('adds canonical N07 SuperGPU composition without creating a second transport', async () => {
  const calls:any[]=[];
  const fakePeer = {
    request: async (target:string, capability:string, payload:unknown, correlationId:string) => {
      calls.push({target,capability,payload,correlationId});
      return { payload:{ ok:true } };
    },
    superGPUExecute: async (values:number[], operation:string, device:string|undefined, correlationId:string) => ({correlationId,payload:{values,operation,device}}),
    superGPUParallel: async (tasks:unknown[], correlationId:string) => ({correlationId,payload:{tasks}}),
  };
  const orchestrator = new N03SynergyOrchestrator(fakePeer as never);
  const result = await orchestrator.superGPUExecute([1,2,3],'identity',undefined,'corr-gpu');
  expect(result.correlationId).toBe('corr-gpu');
  expect((result.payload as any).values).toEqual([1,2,3]);
});
