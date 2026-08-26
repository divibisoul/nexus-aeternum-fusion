export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export interface SoulMeshCapability {
  id: string;
  version: string;
  execution: 'native' | 'cognitive-runtime' | 'delegated';
  description?: string;
}

export type SoulMeshCapabilityHandler = (payload: unknown, context: {
  source: NucleusId;
  target: 'N03';
  correlationId: string;
}) => Promise<unknown> | unknown;

/** N03-owned capabilities. Declaration and executability are deliberately separate. */
export class SoulMeshCapabilityRegistry {
  private readonly capabilities = new Map<string, SoulMeshCapability>();
  private readonly handlers = new Map<string, SoulMeshCapabilityHandler>();

  register(capability: SoulMeshCapability): void { this.capabilities.set(capability.id, capability); }
  registerHandler(id: string, handler: SoulMeshCapabilityHandler): void { this.handlers.set(id, handler); }
  has(id: string): boolean { return this.capabilities.has(id); }
  canExecute(id: string): boolean { return this.capabilities.has(id) && this.handlers.has(id); }
  getAll(): SoulMeshCapability[] { return [...this.capabilities.values()]; }
  async execute(id: string, payload: unknown, context: Parameters<SoulMeshCapabilityHandler>[1]): Promise<unknown> {
    const handler = this.handlers.get(id);
    if (!handler) throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${id}`);
    return handler(payload, context);
  }
}

export const createN03CapabilityRegistry = () => {
  const registry = new SoulMeshCapabilityRegistry();
  registry.register({ id: 'mesh.ping', version: '1.0.0', execution: 'native', description: 'Mesh liveness' });
  registry.register({ id: 'mesh.describe', version: '1.0.0', execution: 'native', description: 'N03 identity and topology description' });
  registry.register({ id: 'capability.list', version: '1.0.0', execution: 'native', description: 'N03 capability discovery' });
  return registry;
};
