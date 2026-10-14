/** @deprecated Compatibility facade. Canonical Mesh envelope/types live in lib/soul-mesh/SoulMeshProtocol.ts. */
import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_NUCLEI,
  createSoulMeshMessage,
  validateSoulMeshMessage,
  isSoulMeshMessage,
  type SoulNucleus,
  type SoulMeshKind,
  type SoulMeshMessage,
} from '../../lib/soul-mesh/SoulMeshProtocol';

export { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION, SOUL_NUCLEI, createSoulMeshMessage, validateSoulMeshMessage, isSoulMeshMessage };
export type { SoulNucleus, SoulMeshKind, SoulMeshMessage };
export type NucleusId = SoulNucleus;

export const NUCLEUS_ID = 'N03' as const;
export const MESH_PEERS = ['N01', 'N02', 'N04', 'N05', 'N06', 'N07'] as const;
export const createMessage = createSoulMeshMessage;

export function validateMessage(message: unknown, nucleusId: NucleusId): message is SoulMeshMessage {
  if (!isSoulMeshMessage(message)) throw new Error('Invalid Mesh message');
  validateSoulMeshMessage(message);
  if (message.target !== nucleusId) throw new Error('Invalid Mesh target');
  return true;
}

export async function handleMeshMessage(
  message: SoulMeshMessage,
  nucleusId: NucleusId,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>,
): Promise<SoulMeshMessage> {
  validateMessage(message, nucleusId);
  if (message.kind !== 'request') return message;
  const capability = message.capability;
  if (!capability?.trim()) throw new Error('Missing Mesh capability');
  const handler = handlers[capability];
  if (!handler) {
    return createSoulMeshMessage({
      source: nucleusId,
      target: message.source,
      kind: 'error',
      capability,
      correlationId: message.correlationId,
      payload: { code: 'CAPABILITY_NOT_FOUND' },
      meta: message.meta,
      transport: message.transport,
    });
  }
  try {
    return createSoulMeshMessage({
      source: nucleusId,
      target: message.source,
      kind: 'response',
      capability,
      correlationId: message.correlationId,
      payload: await handler(message.payload),
      meta: message.meta,
      transport: message.transport,
    });
  } catch (error) {
    return createSoulMeshMessage({
      source: nucleusId,
      target: message.source,
      kind: 'error',
      capability,
      correlationId: message.correlationId,
      payload: { code: 'CAPABILITY_EXECUTION_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      meta: message.meta,
      transport: message.transport,
    });
  }
}
