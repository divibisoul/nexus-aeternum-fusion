import { nexusCoreProcessor, type NexusCoreCapability } from '../../src/core/NexusCoreProcessor';
import { SOUL_MESH_CAPABILITIES } from '../../src/soul-mesh/SoulMeshCapabilities';

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

/**
 * Registers every capability declared by the N03 runtime boundary and binds
 * each one to the existing NexusCoreProcessor. No provider API is introduced.
 */
export const createN03CapabilityRegistry = () => {
  const registry = new SoulMeshCapabilityRegistry();

  for (const capability of SOUL_MESH_CAPABILITIES) {
    const id = capability.id as NexusCoreCapability;
    registry.register({
      id: capability.id,
      version: capability.version,
      execution: 'cognitive-runtime',
      description: capability.description,
    });
    registry.registerHandler(capability.id, async (payload, context) => {
      if (!nexusCoreProcessor.hasCapability(id)) {
        throw new Error(`N03_RUNTIME_CAPABILITY_NOT_REGISTERED:${capability.id}`);
      }
      return nexusCoreProcessor.process({
        id: context.correlationId,
        capability: id,
        input: payload,
        context: { source: context.source, target: context.target },
      });
    });
  }

  return registry;
};

/** Builds the endpoint-compatible map while preserving the real Mesh request context. */
export const createN03HandlerMap = (source: NucleusId = 'N03', correlationId = 'internal') => {
  const registry = createN03CapabilityRegistry();
  return Object.fromEntries(
    registry.getAll().filter(({ id }) => registry.canExecute(id)).map(({ id }) => [
      id,
      (payload: unknown) => registry.execute(id, payload, { source, target: 'N03', correlationId }),
    ]),
  );
};
