import { N03AgentRegistry } from "../../lib/soul-mesh/N03AgentRegistry";
import type { N03Agent } from "../../lib/soul-mesh/N03AgentContract";

export type AgentCardProjection = {
  id: string;
  name: string;
  capabilities: string[];
  executionEvidence: "registered" | "none";
};

export class AgentCardModule {
  readonly id = "L5.AgentCardModule";
  private active = false;

  constructor(private readonly registry: N03AgentRegistry = new N03AgentRegistry()) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  register(agent: N03Agent): void {
    this.registry.register(agent);
  }

  listCards(): AgentCardProjection[] {
    if (!this.active) return [];
    return this.registry.describe().map((agent) => ({
      id: agent.id,
      name: agent.name,
      capabilities: [...agent.capabilities],
      executionEvidence: "registered",
    }));
  }
}

export const agentCardModule = new AgentCardModule();
