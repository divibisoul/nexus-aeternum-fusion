export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;
export const NUCLEUS_ID = 'N03' as const;
export const MESH_PEERS = ['N01','N02','N04','N05','N06','N07'] as const;
export type SoulNucleus = typeof NUCLEUS_ID | (typeof MESH_PEERS)[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error';
export interface SoulMeshMessage {
  protocol: typeof SOUL_MESH_PROTOCOL;
  contractVersion: typeof SOUL_MESH_CONTRACT_VERSION;
  id: string;
  correlationId: string;
  source: SoulNucleus;
  target: SoulNucleus;
  kind: SoulMeshKind;
  capability: string;
  payload: unknown;
  timestamp: number;
  nonce?: string;
  hmac?: string;
}
export function createMessage(input: Omit<SoulMeshMessage,'protocol'|'contractVersion'|'id'|'timestamp'|'nonce'|'hmac'> & { contractVersion?: string }): SoulMeshMessage {
  const id = crypto.randomUUID();
  return { ...input, protocol: SOUL_MESH_PROTOCOL, contractVersion: input.contractVersion ?? SOUL_MESH_CONTRACT_VERSION, id, timestamp: Date.now(), correlationId: input.correlationId || id };
}
export function validateMessage(message: unknown): message is SoulMeshMessage {
  const m = message as Partial<SoulMeshMessage> & { version?: unknown };
  const legacyAllowed = process.env.SOUL_MESH_STRICT_CONTRACT !== 'true';
  if (!m || m.protocol !== SOUL_MESH_PROTOCOL) return false;
  const contractVersion = m.contractVersion ?? (legacyAllowed ? m.version : undefined);
  if (contractVersion !== SOUL_MESH_CONTRACT_VERSION) return false;
  if (!m.id || !m.correlationId || !m.source || !m.target || !m.kind || !m.capability) return false;
  if (m.source !== NUCLEUS_ID && !MESH_PEERS.includes(m.source as Exclude<SoulNucleus,'N03'>)) return false;
  if (m.target !== NUCLEUS_ID && !MESH_PEERS.includes(m.target as Exclude<SoulNucleus,'N03'>)) return false;
  if (m.source === m.target || typeof m.timestamp !== 'number' || !Number.isFinite(m.timestamp)) return false;
  if (Math.abs(Date.now() - m.timestamp) > 30_000) return false;
  if (!['request','response','event','error'].includes(m.kind as string)) return false;
  if ((m.kind === 'request' || m.kind === 'response' || m.kind === 'error') && !String(m.capability).trim()) return false;
  return true;
}
