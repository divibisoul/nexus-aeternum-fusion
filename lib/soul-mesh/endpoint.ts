export const NUCLEUS_ID = 'N03' as const;
export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;

export const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type NucleusId = (typeof NUCLEI)[number];
export type MeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';

export type SoulMeshMessage = {
  protocol: typeof SOUL_MESH_PROTOCOL;
  id: string;
  correlationId: string;
  source: NucleusId;
  target: NucleusId;
  kind: MeshKind;
  capability: string;
  payload: unknown;
  timestamp: number;
};

export type CapabilityHandler = (payload: unknown, message: SoulMeshMessage) => Promise<unknown> | unknown;
export type CapabilityHandlers = Readonly<Record<string, CapabilityHandler>>;

const nucleusSet = new Set<string>(NUCLEI);
const kinds = new Set<MeshKind>(['request', 'response', 'event', 'error', 'ack']);
const MAX_ID_LENGTH = 128;
const MAX_CAPABILITY_LENGTH = 160;
const MAX_PAYLOAD_BYTES = 512 * 1024;

const isNonEmptyString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

const payloadSize = (payload: unknown): number => {
  try {
    return new TextEncoder().encode(JSON.stringify(payload ?? null)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

export function validateMeshMessage(message: unknown): asserts message is SoulMeshMessage {
  if (!message || typeof message !== 'object') throw new Error('INVALID_MESH_MESSAGE');
  const m = message as Partial<SoulMeshMessage>;
  if (m.protocol !== SOUL_MESH_PROTOCOL) throw new Error('UNSUPPORTED_MESH_PROTOCOL');
  if (!isNonEmptyString(m.id, MAX_ID_LENGTH) || !isNonEmptyString(m.correlationId, MAX_ID_LENGTH)) throw new Error('MISSING_MESSAGE_ID');
  if (!nucleusSet.has(String(m.source)) || !nucleusSet.has(String(m.target)) || m.source === m.target) throw new Error('INVALID_NUCLEUS_ROUTE');
  if (!kinds.has(m.kind as MeshKind)) throw new Error('INVALID_MESSAGE_KIND');
  if (!isNonEmptyString(m.capability, MAX_CAPABILITY_LENGTH)) throw new Error('MISSING_CAPABILITY');
  if (typeof m.timestamp !== 'number' || !Number.isFinite(m.timestamp)) throw new Error('INVALID_TIMESTAMP');
  if (Math.abs(Date.now() - m.timestamp) > 5 * 60 * 1000) throw new Error('MESSAGE_TIMESTAMP_OUT_OF_WINDOW');
  if (payloadSize(m.payload) > MAX_PAYLOAD_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
}

export function createResponse(message: SoulMeshMessage, kind: 'response' | 'error', payload: unknown): SoulMeshMessage {
  return {
    protocol: SOUL_MESH_PROTOCOL,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    correlationId: message.correlationId,
    source: NUCLEUS_ID,
    target: message.source,
    kind,
    capability: message.capability,
    payload,
    timestamp: Date.now(),
  };
}

export function describeCapabilities(handlers: CapabilityHandlers) {
  return {
    nucleus: NUCLEUS_ID,
    protocol: SOUL_MESH_PROTOCOL,
    status: 'online' as const,
    capabilities: Object.keys(handlers).sort(),
  };
}

export async function handleMeshMessage(message: unknown, handlers: CapabilityHandlers): Promise<SoulMeshMessage> {
  validateMeshMessage(message);
  if (message.target !== NUCLEUS_ID) throw new Error('WRONG_TARGET');
  if (message.kind !== 'request') return message;

  const handler = handlers[message.capability];
  if (!handler) return createResponse(message, 'error', { code: 'CAPABILITY_HANDLER_NOT_REGISTERED', capability: message.capability, nucleus: NUCLEUS_ID });

  try {
    const result = await handler(message.payload, message);
    return createResponse(message, 'response', { ok: true, result });
  } catch (error) {
    return createResponse(message, 'error', {
      code: 'CAPABILITY_EXECUTION_ERROR',
      capability: message.capability,
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
