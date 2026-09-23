import {
  SoulMeshCapabilityRegistry,
} from "../../soul-mesh/SoulMeshCapabilityRegistry";
import type { SoulMeshCapability } from "../../soul-mesh/SoulMeshCapabilities";

type RegistryWithExecution = {
  getAll(): SoulMeshCapability[];
  has?: (id: string) => boolean;
  canExecute?: (id: string) => boolean;
};

export type CapabilityCardProjection = {
  id: string;
  version: string;
  description?: string;
  execution:
    | "native"
    | "cognitive-runtime"
    | "delegated"
    | "declared";
  registered: boolean;
  executable: boolean | null;
};

export class CapabilityCardModule {
  readonly id = "L5.CapabilityCardModule";
  private active = false;

  constructor(
    private readonly registry: RegistryWithExecution = new SoulMeshCapabilityRegistry(),
  ) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  listCards(): CapabilityCardProjection[] {
    if (!this.active) return [];

    return this.registry.getAll().map((capability) => ({
      id: capability.id,
      version: capability.version,
      description: capability.description,
      execution: capability.execution,
      registered: this.registry.has ? this.registry.has(capability.id) : true,
      executable: this.registry.canExecute
        ? this.registry.canExecute(capability.id)
        : null,
    }));
  }
}

export const capabilityCardModule = new CapabilityCardModule();
