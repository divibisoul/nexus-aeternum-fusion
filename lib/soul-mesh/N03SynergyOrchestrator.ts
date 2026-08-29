import { randomUUID } from 'node:crypto';
import { SoulMeshPeerClient } from './SoulMeshPeerClient';
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

/**
 * N03 composition layer: joins N03 perception/audio with complementary peer AI
 * capabilities without creating a second transport or Mesh.
 */
export class N03SynergyOrchestrator {
  constructor(private readonly peers = new SoulMeshPeerClient('N03')) {}

  async execute(steps: N03SynergyStep[], correlationId = randomUUID()): Promise<N03SynergyResult> {
    let previous: unknown = undefined;
    const results: N03SynergyResult['steps'] = [];

    for (const step of steps) {
      const payload = previous === undefined
        ? step.payload
        : { input: step.payload, previous, correlationId };
      const result = await this.peers.request(step.target, step.capability, payload);
      results.push({ target: step.target, capability: step.capability, result });
      previous = result.payload;
    }

    return { correlationId, steps: results };
  }

  /** N03 perception → N02 reasoning: audio evidence becomes cognitive context. */
  perceptionToReasoning(input: unknown) {
    return this.execute([
      { target: 'N02', capability: 'inference.reason', payload: { perception: input } },
    ]);
  }

  /** N03 perception → N04 execution: detected information becomes tool/document work. */
  perceptionToExecution(input: unknown) {
    return this.execute([
      { target: 'N04', capability: 'tool.execute', payload: { perception: input } },
    ]);
  }

  /** Two-link composition: N03 → N02 → N04, preserving the same task correlation. */
  perceptionReasoningExecution(input: unknown) {
    return this.execute([
      { target: 'N02', capability: 'inference.reason', payload: { perception: input } },
      { target: 'N04', capability: 'tool.execute', payload: { instruction: 'Execute the useful action derived from the reasoning result.' } },
    ]);
  }
}
