export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_VERSION = '1.1.0' as const;
export const NUCLEUS_ID = 'N03' as const;
export const MESH_PEERS = ['N01','N02','N04','N05','N06'] as const;
export type SoulNucleus = typeof NUCLEUS_ID | (typeof MESH_PEERS)[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';
export interface SoulMeshMessage {
  protocol: typeof SOUL_MESH_PROTOCOL;
  version: typeof SOUL_MESH_VERSION;
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
export function createMessage(input: Omit<SoulMeshMessage,'protocol'|'version'|'id'|'timestamp'|'nonce'|'hmac'>): SoulMeshMessage {
  return { ...input, protocol: SOUL_MESH_PROTOCOL, version: SOUL_MESH_VERSION, id: crypto.randomUUID(), timestamp: Date.now() };
}
export function validateMessage(message: unknown): message is SoulMeshMessage {
  const m = message as Partial<SoulMeshMessage>;
  if (!m || m.protocol !== SOUL_MESH_PROTOCOL || m.version !== SOUL_MESH_VERSION) return false;
  if (!m.id || !m.correlationId || !m.source || !m.target || !m.kind || !m.capability) return false;
  if (m.source !== NUCLEUS_ID && !MESH_PEERS.includes(m.source as Exclude<SoulNucleus,'N03'>)) return false;
  if (m.target !== NUCLEUS_ID && !MESH_PEERS.includes(m.target as Exclude<SoulNucleus,'N03'>)) return false;
  if (m.source === m.target || typeof m.timestamp !== 'number' || !Number.isFinite(m.timestamp)) return false;
  if (m.kind === 'request' && !String(m.capability).trim()) return false;
  return true;
}
