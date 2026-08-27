import { createN03CapabilityExposer, type N03PerceptionHandlers } from './SoulMeshCapabilityExposer';

/** Canonical N03 perception capability surface. Existing implementations are injected unchanged. */
export function createN03PerceptionCapabilities(handlers: N03PerceptionHandlers) {
  return createN03CapabilityExposer(handlers);
}
