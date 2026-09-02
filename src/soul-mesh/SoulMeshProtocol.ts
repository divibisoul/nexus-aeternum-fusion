/**
 * @deprecated Compatibility entrypoint.
 * The canonical SOUL Mesh protocol lives in src/mesh/SoulMeshProtocol.ts.
 * Historical N03 callers are adapted by the legacy wrapper below.
 */
export {
  createSoulMeshMessage,
  isSoulMeshMessage,
  toCanonicalMessage,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_MESH_PROTOCOL,
} from './legacy/SoulMeshProtocol';
export type { SoulNucleus, SoulMeshMessage, LegacySoulNucleus } from './legacy/SoulMeshProtocol';
export type { SoulMeshTransport } from '../mesh/SoulMeshProtocol';
