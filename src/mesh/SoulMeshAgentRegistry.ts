import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { SoulMeshAgent } from './SoulMeshAgentContract';

export class SoulMeshAgentRegistry {
  private readonly agents = new Map<string, SoulMeshAgent>();
  private readonly preservedVersions = new Map<string, SoulMeshAgent[]>();

  register(agent: SoulMeshAgent): void {
    if (this.agents.has(agent.id)) throw new Error(`AGENT_ALREADY_REGISTERED:${agent.id}`);
    this.agents.set(agent.id, agent);
  }

  /**
   * Replaces the active implementation only when identity and capability
   * contract remain equivalent. The previous handler object is retained in an
   * append-only history so intentional upgrades do not erase prior behavior.
   * Strict register() remains duplicate-rejecting.
   */
  preserveAndReplace(agent: SoulMeshAgent): void {
    const current = this.agents.get(agent.id);
    if (!current) {
      this.register(agent);
      return;
    }

    const currentCapabilities = [...current.capabilities].sort();
    const nextCapabilities = [...agent.capabilities].sort();
    const sameCapabilities = currentCapabilities.length === nextCapabilities.length
      && currentCapabilities.every((capability, index) => capability === nextCapabilities[index]);
    if (current.nucleus !== agent.nucleus || !sameCapabilities) {
      throw new Error(`AGENT_OVERRIDE_IDENTITY_MISMATCH:${agent.id}`);
    }

    const versions = this.preservedVersions.get(agent.id) ?? [];
    versions.push(current);
    this.preservedVersions.set(agent.id, versions);
    this.agents.set(agent.id, agent);
  }

  listPreservedVersions(): SoulMeshAgent[] {
    return [...this.preservedVersions.values()].flatMap(versions => [...versions]);
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
