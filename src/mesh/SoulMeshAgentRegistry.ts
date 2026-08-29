import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { SoulMeshAgent } from './SoulMeshAgentContract';

export class SoulMeshAgentRegistry {
  private readonly agents = new Map<string, SoulMeshAgent>();

  register(agent: SoulMeshAgent): void {
    if (this.agents.has(agent.id)) throw new Error(`AGENT_ALREADY_REGISTERED:${agent.id}`);
    this.agents.set(agent.id, agent);
  }

  findForCapability(capability: string): SoulMeshAgent | undefined {
    return [...this.agents.values()].find(agent =>
      agent.capabilities.some(c => c === capability || (c.endsWith('.*') && capability.startsWith(c.slice(0, -1))))
    );
  }

  async execute(message: SoulMeshMessage): Promise<unknown> {
    const agent = this.findForCapability(message.capability);
    if (!agent) throw new Error(`AGENT_NOT_AVAILABLE:${message.capability}`);
    return agent.handle(message);
  }

  list(): SoulMeshAgent[] { return [...this.agents.values()]; }
}
