export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;
export const SOUL_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'] as const;
export type NucleusId = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error';
export type SoulMeshMessage = {
  protocol: typeof SOUL_MESH_PROTOCOL;
  contractVersion: typeof SOUL_MESH_CONTRACT_VERSION;
  id: string;
  correlationId: string;
  source: NucleusId;
  target: NucleusId;
  kind: SoulMeshKind;
  capability?: string;
  payload: unknown;
  timestamp: number;
  meta?: { runtime?: string; transport?: string; encoding?: string; version?: string; nonce?: string; traceId?: string };
};

export function validateMessage(m: SoulMeshMessage, nucleusId: NucleusId) {
  if (
    m.protocol !== SOUL_MESH_PROTOCOL
    || m.contractVersion !== SOUL_MESH_CONTRACT_VERSION
    || m.target !== nucleusId
    || m.source === m.target
    || !m.id
    || !m.correlationId
    || !Number.isFinite(m.timestamp)
    || Math.abs(Date.now() - m.timestamp) > 30_000
    || !m.capability
    || !['request', 'response', 'event', 'error'].includes(m.kind)
  ) {
    throw new Error('Invalid Mesh message');
  }
  return true;
}

export async function handleMeshMessage(
  m: SoulMeshMessage,
  nucleusId: NucleusId,
  handlers: Record<string, (p: unknown) => Promise<unknown> | unknown>,
) {
  validateMessage(m, nucleusId);
  if (m.kind !== 'request') return m;
  const h = m.capability ? handlers[m.capability] : undefined;
  if (!h) return { ...m, kind: 'error' as const, target: m.source, source: nucleusId, payload: { code: 'CAPABILITY_NOT_FOUND' } };
  try {
    return { ...m, kind: 'response' as const, target: m.source, source: nucleusId, payload: await h(m.payload) };
  } catch (error) {
    return { ...m, kind: 'error' as const, target: m.source, source: nucleusId, payload: { code: 'CAPABILITY_EXECUTION_ERROR', detail: error instanceof Error ? error.message : String(error) } };
  }
}
