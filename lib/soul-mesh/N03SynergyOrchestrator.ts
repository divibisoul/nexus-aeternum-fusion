import { randomUUID } from 'node:crypto';
import { SoulMeshPeerClient, type SuperGPUTask } from './SoulMeshPeerClient';
import type { SoulNucleus } from './SoulMeshProtocol';

export type N03SynergyStep = {
  target: Exclude<SoulNucleus, 'N03'>;
  capability: string;
  payload: unknown;
};

export type N03SynergyResult = {
  correlationId: string;
  steps: Array<{ target: Exclude<SoulNucleus, 'N03'>; capability: string; result: SoulMeshPeerResult }>;
};

type SoulMeshPeerResult = Awaited<ReturnType<SoulMeshPeerClient['request']>>;

export type N03FusionBranch = {
  name: string;
  steps: N03SynergyStep[];
};

export type N03FusionResult = {
  correlationId: string;
  branches: Array<N03SynergyResult & { name: string; synergy: number }>;
  fusion: { synergy: number; inputs: unknown[] };
};

export type N03SuperGPUResult = {
  correlationId: string;
  payload: unknown;
};

export type N04ToolRequest = {
  tool: 'createDocument' | 'updateDocument' | 'getWeather' | 'requestSuggestions';
  arguments?: unknown;
};

function normalizeN04ToolRequest(input: unknown): N04ToolRequest {
  if (!input || typeof input !== 'object' || !('tool' in input) || typeof (input as { tool?: unknown }).tool !== 'string') {
    throw new Error('N04_TOOL_REQUEST_REQUIRED');
  }
  const tool = (input as { tool: string }).tool;
  if (!['createDocument', 'updateDocument', 'getWeather', 'requestSuggestions'].includes(tool)) {
    throw new Error(`N04_TOOL_NOT_DECLARED:${tool}`);
  }
  return input as N04ToolRequest;
}

/**
 * N03 composition layer: joins N03 perception/audio with complementary peer AI
 * capabilities and N07 SuperGPU orchestration without creating a second transport.
 */
export class N03SynergyOrchestrator {
  constructor(private readonly peers = new SoulMeshPeerClient('N03')) {}

  async execute(steps: N03SynergyStep[], correlationId = randomUUID()): Promise<N03SynergyResult> {
    let previous: unknown = undefined;
    const results: N03SynergyResult['steps'] = [];
    for (const step of steps) {
      const payload = previous === undefined ? step.payload : { input: step.payload, previous, correlationId };
      const result = await this.peers.request(step.target, step.capability, payload, correlationId);
      results.push({ target: step.target, capability: step.capability, result });
      previous = result.payload;
    }
    return { correlationId, steps: results };
  }

  async superGPUExecute(values: number[], operation = 'identity', device?: string, correlationId = randomUUID()): Promise<N03SuperGPUResult> {
    return { correlationId, payload: await this.peers.superGPUExecute(values, operation, device, correlationId) };
  }

  async superGPUParallel(tasks: SuperGPUTask[], correlationId = randomUUID()): Promise<N03SuperGPUResult> {
    return { correlationId, payload: await this.peers.superGPUParallel(tasks, correlationId) };
  }

  perceptionToReasoning(input: unknown) {
    return this.execute([{ target: 'N02', capability: 'inference.reason', payload: { perception: input } }]);
  }

  executeToolOnN04(request: N04ToolRequest, correlationId = randomUUID()) {
    const toolRequest = normalizeN04ToolRequest(request);
    return this.execute([{ target: 'N04', capability: 'tool.execute', payload: toolRequest }], correlationId);
  }

  perceptionToExecution(input: unknown) {
    return this.executeToolOnN04(normalizeN04ToolRequest(input));
  }

  perceptionReasoningExecution(input: unknown) {
    const toolRequest = normalizeN04ToolRequest(input);
    return this.execute([
      { target: 'N02', capability: 'inference.reason', payload: { perception: input } },
      { target: 'N04', capability: 'tool.execute', payload: toolRequest },
    ]);
  }

  /**
   * Two branches run concurrently. Their outputs are then fused into one
   * higher-level result, preserving one correlationId for the whole operation.
   * The score is derived from observed branch capabilities, not a hard-coded claim.
   */
  async fuseTwoBranches(branches: [N03FusionBranch, N03FusionBranch], correlationId = randomUUID()): Promise<N03FusionResult> {
    const completed = await Promise.all(branches.map(async branch => {
      const result = await this.execute(branch.steps, correlationId);
      const uniqueCapabilities = new Set(result.steps.map(step => step.capability)).size;
      const uniqueNuclei = new Set(result.steps.map(step => step.target)).size;
      return { ...result, name: branch.name, synergy: uniqueCapabilities * Math.max(1, uniqueNuclei) };
    }));

    const inputs = completed.map(branch => branch.steps.at(-1)?.result.payload);
    const capabilityCount = new Set(completed.flatMap(branch => branch.steps.map(step => step.capability))).size;
    const nucleusCount = new Set(completed.flatMap(branch => branch.steps.map(step => step.target))).size;
    return {
      correlationId,
      branches: completed,
      fusion: { synergy: capabilityCount * Math.max(1, nucleusCount), inputs },
    };
  }

  /** N03+N02 reasoning and N03+N04 action execute together before fusion. */
  perceptionDualFusion(input: unknown, toolRequest: N04ToolRequest) {
    const normalizedToolRequest = normalizeN04ToolRequest(toolRequest);
    return this.fuseTwoBranches([
      { name: 'N03-N02-cognition', steps: [{ target: 'N02', capability: 'inference.reason', payload: { perception: input } }] },
      { name: 'N03-N04-action', steps: [{ target: 'N04', capability: 'tool.execute', payload: normalizedToolRequest }] },
    ]);
  }
}