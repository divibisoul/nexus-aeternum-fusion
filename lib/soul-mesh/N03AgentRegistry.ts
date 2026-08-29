import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { N03Agent } from './N03AgentContract';

export class N03AgentRegistry {
  private readonly agents = new Map<string, N03Agent>();
  register(agent: N03Agent): void { this.agents.set(agent.id, agent); }
  find(capability: string): N03Agent | undefined { return [...this.agents.values()].find(agent => agent.capabilities.includes(capability)); }
  async execute(message: SoulMeshMessage): Promise<unknown> {
    const agent = this.find(message.capability ?? '');
    if (!agent) throw new Error(`AGENT_NOT_FOUND:${message.capability ?? ''}`);
    return agent.execute(message);
  }
  describe() { return [...this.agents.values()].map(({ id, name, capabilities }) => ({ id, name, capabilities })); }
}
