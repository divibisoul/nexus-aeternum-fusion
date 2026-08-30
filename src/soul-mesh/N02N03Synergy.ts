import { SOUL_MESH_CAPABILITIES as N02_CAPABILITIES } from '../../../Eternium-/src/soul-mesh/SoulMeshCapabilities';
import { SOUL_MESH_CAPABILITIES as N03_CAPABILITIES } from './SoulMeshCapabilities';
import { calculatePairFusion, type FusionCapability } from './N03PairFusion';

/**
 * Real N02↔N03 capability composition.
 *
 * The N02 catalog and the N03 catalog are the source of truth. This module
 * does not invent capabilities, agents or tools. Missing inventories remain
 * explicit so the next stage can complete them safely.
 */
export function buildN02N03Synergy() {
  const n02: FusionCapability = {
    nucleus: 'N02',
    agents: [],
    tools: [...new Set(N02_CAPABILITIES.flatMap(capability => capability.tools ?? []))],
    capabilities: N02_CAPABILITIES.map(capability => capability.id),
  };

  const n03: FusionCapability = {
    nucleus: 'N03',
    agents: [],
    tools: [],
    capabilities: N03_CAPABILITIES.map(capability => capability.id),
  };

  return calculatePairFusion(n02, n03);
}

export const N02_N03_SYNERGY = buildN02N03Synergy();
