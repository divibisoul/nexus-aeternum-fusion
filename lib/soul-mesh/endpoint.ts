import {
  SOUL_MESH_PROTOCOL,
  type SoulMeshMessage as CanonicalSoulMeshMessage,
  type SoulMeshKind,
  type SoulNucleus,
  validateSoulMeshMessage,
} from './SoulMeshProtocol';

export const NUCLEUS_ID: SoulNucleus = 'N03';
export const SOUL_TRANSPORTS = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'] as const;
export type SoulTransport = typeof SOUL_TRANSPORTS[number];
export const N03_IMPLEMENTED_TRANSPORTS: readonly SoulTransport[] = ['IN_PROCESS', 'HTTP', 'REALTIME'];
export const N03_ADAPTER_TARGETS: readonly SoulTransport[] = ['WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'];
export type SoulMeshMessage = CanonicalSoulMeshMessage<unknown> & { transport?: SoulTransport };

export function validateMeshMessage(message: SoulMeshMessage): true {
  validateSoulMeshMessage(message);
  if (message.transport && !SOUL_TRANSPORTS.includes(message.transport)) throw new Error('UNSUPPORTED_TRANSPORT');
  return true;
}

export function getN03Channels() {
  return {
    inbound: ['N01.IN.N03', 'N02.IN.N03', 'N04.IN.N03', 'N05.IN.N03', 'N06.IN.N03'],
    outbound: ['N03.OUT.N01', 'N03.OUT.N02', 'N03.OUT.N04', 'N03.OUT.N05', 'N03.OUT.N06'],
  } as const;
}

export function negotiateTransport(
  offered: readonly SoulTransport[],
  preferred: readonly SoulTransport[] = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'],
): SoulTransport | null {
  for (const transport of preferred) if (offered.includes(transport)) return transport;
  return null;
}

export function getN03InteroperabilityProfile() {
  return {
    nucleus: NUCLEUS_ID,
    protocol: SOUL_MESH_PROTOCOL,
    channels: getN03Channels(),
    referenceTransports: [...SOUL_TRANSPORTS],
    implementedTransports: [...N03_IMPLEMENTED_TRANSPORTS],
    adapterTargets: [...N03_ADAPTER_TARGETS],
  } as const;
}

export type SoulMeshHandler = (payload: unknown) => Promise<unknown> | unknown;
export type SoulMeshHandlerRegistry = Readonly<Record<string, SoulMeshHandler>>;

export async function handleMeshMessage(message: SoulMeshMessage, handlers: SoulMeshHandlerRegistry): Promise<SoulMeshMessage> {
  validateMeshMessage(message);
  if (message.target !== NUCLEUS_ID) throw new Error('WRONG_TARGET');
  if (message.kind !== 'request') return message;
  const handler = handlers[message.capability ?? ''];
  if (!handler) return { ...message, kind: 'error' as SoulMeshKind, payload: { code: 'CAPABILITY_NOT_FOUND' } };
  try {
    return { ...message, kind: 'response' as SoulMeshKind, payload: await handler(message.payload) };
  } catch (error) {
    return {
      ...message,
      kind: 'error' as SoulMeshKind,
      payload: { code: 'CAPABILITY_EXECUTION_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}
