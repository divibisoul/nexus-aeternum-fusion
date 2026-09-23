/**
 * L6 — MODULE DETAIL MODULE
 * Host: N03 | Affinity: M5_PERCEPTION/SOUL_MESH
 *
 * Inspection projection over the real N03 agent/capability registries.
 * No local duplicate registry is created. The exported instance starts UNBOUND
 * until the host wires the existing authoritative registries.
 */
import type { N03AgentRegistry } from "../../../lib/soul-mesh/N03AgentRegistry";
import type { SoulMeshCapabilityRegistry } from "../../../lib/soul-mesh/SoulMeshCapabilityRegistry";

export interface ModuleDetail {
  id: string;
  kind: "agent" | "capability" | "unknown";
  signature: unknown;
  executable?: boolean;
  timestamp: number;
}

export class ModuleDetailModule {
  readonly id = "module-detail" as const;
  private agentRegistry?: N03AgentRegistry;
  private capabilityRegistry?: SoulMeshCapabilityRegistry;
  private selected: string | null = null;

  bindRegistries(
    agentRegistry: N03AgentRegistry,
    capabilityRegistry: SoulMeshCapabilityRegistry,
  ): void {
    this.agentRegistry = agentRegistry;
    this.capabilityRegistry = capabilityRegistry;
  }

  showDetail(moduleId: string): ModuleDetail {
    const id = moduleId.trim();
    if (!id) throw new Error("MODULE_ID_REQUIRED");
    this.selected = id;

    const agents = this.agentRegistry?.describe() ?? [];
    const agent = agents.find(item => item.id === id);
    if (agent) {
      return {
        id,
        kind: "agent",
        signature: agent,
        timestamp: Date.now(),
      };
    }

    const capabilities = this.capabilityRegistry?.getAll() ?? [];
    const capability = capabilities.find(item => item.id === id);
    if (capability) {
      return {
        id,
        kind: "capability",
        signature: capability,
        executable: this.capabilityRegistry?.canExecute(id),
        timestamp: Date.now(),
      };
    }

    return {
      id,
      kind: "unknown",
      signature: {
        bound: Boolean(this.agentRegistry || this.capabilityRegistry),
        knownAgents: agents.length,
        knownCapabilities: capabilities.length,
      },
      timestamp: Date.now(),
    };
  }

  close(): void {
    this.selected = null;
  }

  getSelected(): string | null {
    return this.selected;
  }

  isBound(): boolean {
    return Boolean(this.agentRegistry || this.capabilityRegistry);
  }
}

export const moduleDetailModule = new ModuleDetailModule();
