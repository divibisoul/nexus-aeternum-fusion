export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_VERSION = '1.1.0' as const;
export const NUCLEUS_ID = 'N03' as const;
export const MESH_PEERS = ['N01','N02','N04','N05','N06'] as const;
export type SoulNucleus = typeof NUCLEUS_ID | (typeof MESH_PEERS)[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';
const KINDS = new Set<SoulMeshKind>(['request','response','event','error','ack']);
const MAX_ID_LENGTH = 200;
const MAX_CAPABILITY_LENGTH = 200;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
function isNucleus(value: unknown): value is SoulNucleus { return typeof value === 'string' && (value === NUCLEUS_ID || (MESH_PEERS as readonly string[]).includes(value)); }
function randomId(): string { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
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
  return { ...input, protocol: SOUL_MESH_PROTOCOL, version: SOUL_MESH_VERSION, id: randomId(), timestamp: Date.now() };
}
export function validateMessage(message: unknown): message is SoulMeshMessage {
  if (!message || typeof message !== 'object') return false;
  const m = message as Partial<SoulMeshMessage>;
  return m.protocol === SOUL_MESH_PROTOCOL && m.version === SOUL_MESH_VERSION
    && typeof m.id === 'string' && m.id.length > 0 && m.id.length <= MAX_ID_LENGTH
    && typeof m.correlationId === 'string' && m.correlationId.length > 0 && m.correlationId.length <= MAX_ID_LENGTH
    && isNucleus(m.source) && isNucleus(m.target) && m.source !== m.target
    && typeof m.kind === 'string' && KINDS.has(m.kind)
    && typeof m.capability === 'string' && m.capability.trim().length > 0 && m.capability.length <= MAX_CAPABILITY_LENGTH
    && typeof m.timestamp === 'number' && Number.isFinite(m.timestamp) && Math.abs(Date.now() - m.timestamp) <= MAX_CLOCK_SKEW_MS;
}
