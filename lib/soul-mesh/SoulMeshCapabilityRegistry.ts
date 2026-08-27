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

/** Creates the native N03 Mesh capabilities and activates their handlers. */
export const createN03CapabilityRegistry = () => {
  const registry = new SoulMeshCapabilityRegistry();
  registry.register({ id: 'mesh.ping', version: '1.0.0', execution: 'native', description: 'Mesh liveness' });
  registry.register({ id: 'mesh.describe', version: '1.0.0', execution: 'native', description: 'N03 identity, channels and transport profile' });
  registry.register({ id: 'capability.list', version: '1.0.0', execution: 'native', description: 'N03 capability discovery' });

  registry.registerHandler('mesh.ping', async () => ({ ok: true, nucleus: 'N03', protocol: 'soul-mesh/1', timestamp: Date.now() }));
  registry.registerHandler('mesh.describe', async () => ({
    nucleus: 'N03', protocol: 'soul-mesh/1',
    peers: ['N01', 'N02', 'N04', 'N05', 'N06'],
    inbound: true, outbound: true,
    transports: ['IN_PROCESS', 'HTTP', 'REALTIME'],
    adapterTargets: ['WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'],
  }));
  registry.registerHandler('capability.list', async () => registry.getAll());

  return registry;
};

/** Adapter for the existing endpoint's payload-only handler contract. */
export const createN03HandlerMap = () => {
  const registry = createN03CapabilityRegistry();
  return Object.fromEntries(
    registry.getAll().filter(({ id }) => registry.canExecute(id)).map(({ id }) => [
      id,
      (payload: unknown) => registry.execute(id, payload, { source: 'N03', target: 'N03', correlationId: 'internal' }),
    ]),
  );
};
