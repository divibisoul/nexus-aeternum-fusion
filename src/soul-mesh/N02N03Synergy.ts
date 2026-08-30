import { SOUL_MESH_CAPABILITIES as N03_CAPABILITIES } from './SoulMeshCapabilities';
import { calculatePairFusion, type FusionCapability } from './N03PairFusion';

export type DeclaredCapability = {
  id: string;
  tools?: string[];
};

/**
 * N02↔N03 composition using capability declarations supplied by each
 * nucleus. Repositories remain independently buildable; N02 data crosses
 * the boundary as a manifest rather than a source-code import.
 */
export function buildN02N03Synergy(n02Capabilities: readonly DeclaredCapability[]) {
  const n02: FusionCapability = {
    nucleus: 'N02',
    agents: [],
    tools: [...new Set(n02Capabilities.flatMap(capability => capability.tools ?? []))],
    capabilities: n02Capabilities.map(capability => capability.id),
  };

  const n03: FusionCapability = {
    nucleus: 'N03',
    agents: [],
    tools: [],
    capabilities: N03_CAPABILITIES.map(capability => capability.id),
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

export const N02_N03_SYNERGY = buildN02N03Synergy(VERIFIED_N02_CAPABILITIES);
