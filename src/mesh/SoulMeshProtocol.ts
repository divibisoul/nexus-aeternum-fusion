/** Compatibility facade: canonical Mesh protocol lives in lib/soul-mesh/SoulMeshProtocol.ts. */
import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_NUCLEI,
  createSoulMeshMessage,
  validateSoulMeshMessage,
  isSoulMeshMessage,
  type SoulNucleus,
  type SoulMeshMessage,
} from '../../lib/soul-mesh/SoulMeshProtocol';

export {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_NUCLEI,
  createSoulMeshMessage,
  validateSoulMeshMessage,
  isSoulMeshMessage,
};
export type { SoulNucleus, SoulMeshMessage };

export const NUCLEUS_ID = 'N03' as const;
export const MESH_PEERS = ['N01','N02','N04','N05','N06','N07'] as const;

export const createMessage = createSoulMeshMessage;

export function validateMessage(message: unknown): message is SoulMeshMessage {
  return isSoulMeshMessage(message);
}
