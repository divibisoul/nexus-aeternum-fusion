export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;
export const SOUL_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'] as const;
export type SoulNucleus = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error';
export type SoulMeshTransportKind = 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME';
export interface SoulMeshMeta { runtime?: string; transport?: string; encoding?: string; version?: string; nonce?: string; traceId?: string; }
export interface SoulMeshMessage<T = unknown> {
  protocol: typeof SOUL_MESH_PROTOCOL;
  contractVersion: typeof SOUL_MESH_CONTRACT_VERSION;
  id: string;
  correlationId: string;
  source: SoulNucleus;
  target: SoulNucleus;
  kind: SoulMeshKind;
  capability?: string;
  payload: T;
  timestamp: number;
  transport?: SoulMeshTransportKind;
  meta?: SoulMeshMeta;
}

export function createSoulMeshMessage<T>(input: Omit<SoulMeshMessage<T>, 'protocol' | 'contractVersion' | 'id' | 'timestamp'> & { contractVersion?: typeof SOUL_MESH_CONTRACT_VERSION }): SoulMeshMessage<T> {
  const id = crypto.randomUUID();
  return {
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: input.contractVersion ?? SOUL_MESH_CONTRACT_VERSION,
    id,
    timestamp: Date.now(),
    correlationId: input.correlationId || id,
    ...input,
  };
}

export function validateSoulMeshMessage(message: SoulMeshMessage): void {
  if (message.protocol !== SOUL_MESH_PROTOCOL) throw new Error('INVALID_PROTOCOL');
  if (message.contractVersion !== SOUL_MESH_CONTRACT_VERSION) throw new Error('INVALID_CONTRACT_VERSION');
  if (!SOUL_NUCLEI.includes(message.source) || !SOUL_NUCLEI.includes(message.target)) throw new Error('INVALID_NUCLEUS');
  if (message.source === message.target) throw new Error('SELF_ROUTE_NOT_ALLOWED');
  if (!message.id || message.id.length > 200 || !message.correlationId || message.correlationId.length > 200) throw new Error('INVALID_CORRELATION');
  if (!['request', 'response', 'event', 'error'].includes(message.kind)) throw new Error('INVALID_KIND');
  if ((message.kind === 'request' || message.kind === 'response' || message.kind === 'error') && !message.capability?.trim()) throw new Error('CAPABILITY_REQUIRED');
  if (!Number.isFinite(message.timestamp) || Math.abs(Date.now() - message.timestamp) > 30_000) throw new Error('INVALID_TIMESTAMP');
  if (message.transport && !['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'].includes(message.transport)) throw new Error('INVALID_TRANSPORT');
}

export function isSoulMeshMessage(value: unknown): value is SoulMeshMessage {
  try { validateSoulMeshMessage(value as SoulMeshMessage); return true; } catch { return false; }
}
