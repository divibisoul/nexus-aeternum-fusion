import { createN03CapabilityRegistry, type SoulMeshCapabilityHandler, type SoulMeshCapabilityRegistry } from './SoulMeshCapabilityRegistry';

export interface N03PerceptionHandlers {
  analyzeImage?: SoulMeshCapabilityHandler;
  processAudio?: SoulMeshCapabilityHandler;
  analyzeMultimodal?: SoulMeshCapabilityHandler;
}

const MAPPINGS = [
  ['perception.analyzeImage', 'analyzeImage'],
  ['perception.processAudio', 'processAudio'],
  ['perception.analyzeMultimodal', 'analyzeMultimodal'],
] as const;

/** Bridges existing N03 perception implementations into the Mesh registry without duplicating them. */
export function createN03CapabilityExposer(handlers: N03PerceptionHandlers, registry: SoulMeshCapabilityRegistry = createN03CapabilityRegistry()) {
  for (const [capability, key] of MAPPINGS) {
    const handler = handlers[key];
    if (!handler) continue;
    registry.register({ id: capability, version: '1.0.0', execution: 'native', description: `N03 perception capability: ${capability}` });
    registry.registerHandler(capability, handler);
  }
  return registry;
}
