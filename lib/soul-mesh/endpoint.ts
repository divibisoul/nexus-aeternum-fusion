/** @deprecated Compatibility facade. The only canonical Mesh wire contract is SoulMeshProtocol.ts. */
import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  SOUL_NUCLEI,
  createSoulMeshMessage,
  validateSoulMeshMessage,
  type SoulNucleus,
  type SoulMeshMessage as CanonicalSoulMeshMessage,
  type SoulMeshTransportKind,
} from './SoulMeshProtocol';

export { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION, SOUL_NUCLEI };
export type { SoulNucleus };
export const NUCLEUS_ID = 'N03' as const;
export const SOUL_TRANSPORTS: readonly SoulMeshTransportKind[] = [
  'IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME',
];
export type SoulTransport = SoulMeshTransportKind;
export const N03_IMPLEMENTED_TRANSPORTS: readonly SoulTransport[] = ['IN_PROCESS', 'HTTP', 'REALTIME'];
export const N03_ADAPTER_TARGETS: readonly SoulTransport[] = ['WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'];

type LegacyMeshKind = CanonicalSoulMeshMessage['kind'] | 'ack';
export type SoulMeshMessage = Omit<CanonicalSoulMeshMessage, 'kind' | 'timestamp' | 'contractVersion'> & {
  contractVersion?: typeof SOUL_MESH_CONTRACT_VERSION;
  kind: LegacyMeshKind;
  timestamp: number | string;
};

function toCanonicalMessage(message: SoulMeshMessage): CanonicalSoulMeshMessage {
  const timestamp = typeof message.timestamp === 'number'
    ? message.timestamp
    : (/^-?\d+(\.\d+)?$/.test(message.timestamp) ? Number(message.timestamp) : Date.parse(message.timestamp));
  if (!Number.isFinite(timestamp)) throw new Error('INVALID_TIMESTAMP');
  const canonical = {
    ...message,
    timestamp,
    kind: message.kind === 'ack' ? 'response' : message.kind,
  } as CanonicalSoulMeshMessage;
  validateSoulMeshMessage(canonical);
  return canonical;
}

/** Preserve the legacy endpoint API while delegating all envelope rules to the canonical validator. */
export function validateMeshMessage(message: SoulMeshMessage): true {
  toCanonicalMessage(message);
  return true;
}

export function getN03Channels() {
  return {
    inbound: ['N01.IN.N03', 'N02.IN.N03', 'N04.IN.N03', 'N05.IN.N03', 'N06.IN.N03', 'N07.IN.N03'],
    outbound: ['N03.OUT.N01', 'N03.OUT.N02', 'N03.OUT.N04', 'N03.OUT.N05', 'N03.OUT.N06', 'N03.OUT.N07'],
  } as const;
}

export function negotiateTransport(
  offered: readonly SoulTransport[],
  preferred: readonly SoulTransport[] = ['IN_PROCESS', 'HTTP', 'REALTIME', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'],
): SoulTransport | null {
  for (const transport of preferred) if (offered.includes(transport)) return transport;
  return null;
}

export function getN03InteroperabilityProfile() {
  return {
    nucleus: NUCLEUS_ID,
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    channels: getN03Channels(),
    referenceTransports: [...SOUL_TRANSPORTS],
    implementedTransports: [...N03_IMPLEMENTED_TRANSPORTS],
    adapterTargets: [...N03_ADAPTER_TARGETS],
  } as const;
}

export async function handleMeshMessage(
  input: SoulMeshMessage,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>,
): Promise<SoulMeshMessage> {
  const message = toCanonicalMessage(input);
  if (message.target !== NUCLEUS_ID) throw new Error('WRONG_TARGET');
  if (input.kind !== 'request') return input;
  const capability = message.capability;
  if (!capability?.trim()) throw new Error('MISSING_CAPABILITY');
  const handler = handlers[capability];
  if (!handler) {
    return createSoulMeshMessage({
      source: NUCLEUS_ID,
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
      source: NUCLEUS_ID,
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
      source: NUCLEUS_ID,
      target: message.source,
      kind: 'error',
      capability,
      correlationId: message.correlationId,
      payload: {
        code: 'CAPABILITY_EXECUTION_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      meta: message.meta,
      transport: message.transport,
    });
  }
}
