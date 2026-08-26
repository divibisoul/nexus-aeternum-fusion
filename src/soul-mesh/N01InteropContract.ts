export const N01_REFERENCE_PROTOCOL = 'soul-mesh/1' as const;
export const N01_REFERENCE_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as const;
export const N01_REFERENCE_KINDS = ['request', 'response', 'event', 'error', 'ack'] as const;

export type N01ReferenceKind = typeof N01_REFERENCE_KINDS[number];

export type N01ReferenceMessage = {
  protocol: typeof N01_REFERENCE_PROTOCOL;
  id: string;
  correlationId: string;
  source: typeof N01_REFERENCE_NUCLEI[number];
  target: typeof N01_REFERENCE_NUCLEI[number];
  kind: N01ReferenceKind;
  capability: string;
  payload: unknown;
  timestamp: number | string;
};

export function normalizeReferenceTimestamp(value: number | string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error('INVALID_TIMESTAMP');
}

export function validateN01ReferenceMessage(message: unknown): asserts message is N01ReferenceMessage {
  if (!message || typeof message !== 'object') throw new Error('INVALID_MESH_MESSAGE');
  const m = message as Partial<N01ReferenceMessage>;
  if (m.protocol !== N01_REFERENCE_PROTOCOL) throw new Error('UNSUPPORTED_MESH_PROTOCOL');
  if (typeof m.id !== 'string' || !m.id.trim()) throw new Error('MISSING_MESSAGE_ID');
  if (typeof m.correlationId !== 'string' || !m.correlationId.trim()) throw new Error('MISSING_CORRELATION_ID');
  if (!N01_REFERENCE_NUCLEI.includes(m.source as typeof N01_REFERENCE_NUCLEI[number]) || !N01_REFERENCE_NUCLEI.includes(m.target as typeof N01_REFERENCE_NUCLEI[number])) throw new Error('INVALID_NUCLEUS_ROUTE');
  if (m.source === m.target) throw new Error('INVALID_NUCLEUS_ROUTE');
  if (!N01_REFERENCE_KINDS.includes(m.kind as N01ReferenceKind)) throw new Error('INVALID_MESSAGE_KIND');
  if (typeof m.capability !== 'string' || !m.capability.trim()) throw new Error('MISSING_CAPABILITY');
  normalizeReferenceTimestamp(m.timestamp as number | string);
}
