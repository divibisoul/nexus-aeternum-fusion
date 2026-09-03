import {
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_MESH_PROTOCOL,
  createMessage,
  validateMessage as validateCanonicalMessage,
  type SoulMeshKind,
  type SoulMeshMessage as CanonicalSoulMeshMessage,
  type SoulNucleus as CanonicalSoulNucleus,
} from '../../mesh/SoulMeshProtocol';

/** @deprecated Use the canonical N01–N07 identifiers from src/mesh/SoulMeshProtocol.ts. */
export type LegacySoulNucleus = 'aeternum' | 'nexus' | 'eternium' | 'chatbot' | 'chatbots' | 'chatbot-2000';
export type SoulNucleus = LegacySoulNucleus;
export type SoulMeshMessage<T = unknown> = {
  protocol: typeof SOUL_MESH_PROTOCOL;
  id: string;
  correlationId: string;
  source: LegacySoulNucleus;
  target: LegacySoulNucleus;
  kind: SoulMeshKind;
  capability?: string;
  payload: T;
  timestamp: number;
};

const LEGACY_TO_CANONICAL: Record<LegacySoulNucleus, CanonicalSoulNucleus> = {
  aeternum: 'N01', nexus: 'N03', eternium: 'N02', chatbot: 'N04', chatbots: 'N05', 'chatbot-2000': 'N06',
};
const CANONICAL_TO_LEGACY = Object.fromEntries(Object.entries(LEGACY_TO_CANONICAL).map(([legacy, canonical]) => [canonical, legacy])) as Record<string, LegacySoulNucleus>;

export function toCanonicalMessage<T>(message: SoulMeshMessage<T>): CanonicalSoulMeshMessage {
  if (message.protocol !== SOUL_MESH_PROTOCOL) throw new Error('SOUL_MESH_PROTOCOL_MISMATCH');
  return createMessage({ correlationId: message.correlationId, source: LEGACY_TO_CANONICAL[message.source], target: LEGACY_TO_CANONICAL[message.target], kind: message.kind, capability: message.capability ?? '', payload: message.payload });
}

/** @deprecated Validate via the canonical protocol after conversion. */
export function isSoulMeshMessage(value: unknown): value is SoulMeshMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SoulMeshMessage>;
  if (candidate.protocol !== SOUL_MESH_PROTOCOL) return false;
  if (typeof candidate.source !== 'string' || !(candidate.source in LEGACY_TO_CANONICAL)) return false;
  if (typeof candidate.target !== 'string' || !(candidate.target in LEGACY_TO_CANONICAL)) return false;
  return validateCanonicalMessage({ ...candidate, contractVersion: SOUL_MESH_CONTRACT_VERSION, source: LEGACY_TO_CANONICAL[candidate.source], target: LEGACY_TO_CANONICAL[candidate.target], capability: candidate.capability ?? '' });
}

/** @deprecated Creates a legacy-shaped adapter message backed by the canonical protocol. */
export function createSoulMeshMessage<T>(input: Omit<SoulMeshMessage<T>, 'protocol' | 'id' | 'timestamp'>): SoulMeshMessage<T> {
  const canonical = createMessage({ correlationId: input.correlationId, source: LEGACY_TO_CANONICAL[input.source], target: LEGACY_TO_CANONICAL[input.target], kind: input.kind, capability: input.capability ?? '', payload: input.payload });
  return { protocol: canonical.protocol, id: canonical.id, correlationId: canonical.correlationId, source: CANONICAL_TO_LEGACY[canonical.source], target: CANONICAL_TO_LEGACY[canonical.target], kind: canonical.kind, capability: canonical.capability || undefined, payload: canonical.payload, timestamp: canonical.timestamp };
}
