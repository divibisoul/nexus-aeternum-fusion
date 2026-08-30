import { SOUL_MESH_CAPABILITIES as N03_CAPABILITIES } from './SoulMeshCapabilities';
import { calculatePairFusion, type FusionCapability } from './N03PairFusion';

export type DeclaredCapability = {
  id: string;
  tools?: string[];
};

export type SynergyRuntimeInventory = {
  agents?: string[];
  tools?: string[];
  capabilities?: DeclaredCapability[];
};

/**
 * N02↔N03 composition. Runtime inventories are accepted explicitly so the
 * fusion engine never invents agents or tools or silently treats unknown
 * inventories as proven empty.
 */
export function buildN02N03Synergy(
  n02Capabilities: readonly DeclaredCapability[],
  n02Runtime: SynergyRuntimeInventory = {},
  n03Runtime: SynergyRuntimeInventory = {},
) {
  const n02Declared = n02Runtime.capabilities ?? n02Capabilities;
  const n03Declared = n03Runtime.capabilities ?? N03_CAPABILITIES.map(capability => ({ id: capability.id }));

  const n02: FusionCapability = {
    nucleus: 'N02',
    agents: [...new Set(n02Runtime.agents ?? [])],
    tools: [...new Set([
      ...n02Declared.flatMap(capability => capability.tools ?? []),
      ...(n02Runtime.tools ?? []),
    ])],
    capabilities: n02Declared.map(capability => capability.id),
  };

  const n03: FusionCapability = {
    nucleus: 'N03',
    agents: [...new Set(n03Runtime.agents ?? [])],
    tools: [...new Set([
      ...n03Declared.flatMap(capability => capability.tools ?? []),
      ...(n03Runtime.tools ?? []),
    ])],
    capabilities: n03Declared.map(capability => capability.id),
  };

  return calculatePairFusion(n02, n03);
}

/** Verified against N02/SoulMeshCapabilities.ts in GitHub at integration time. */
export const VERIFIED_N02_CAPABILITIES: readonly DeclaredCapability[] = [
  { id: 'cognitive-processing' },
  { id: 'ai.generate' },
  { id: 'ai.multimodal' },
  { id: 'mesh.describe' },
];

/**
 * Static baseline. Full agent/tool synergy is only claimed after runtime
 * registries provide their inventories through buildN02N03Synergy().
 */
export const N02_N03_SYNERGY = buildN02N03Synergy(VERIFIED_N02_CAPABILITIES);
