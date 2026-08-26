import type { NucleusId, SoulMeshMessage } from './endpoint';

export type SoulHybridTransportKind = 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME' | 'WEBVIEW_BRIDGE' | 'IN_PROCESS';

export interface SoulTransportResult {
  response: SoulMeshMessage;
  transport: SoulHybridTransportKind;
}

/**
 * Outbound transport for N03. URLs are deployment configuration, never hard-coded.
 * A successful HTTP response proves delivery to an endpoint only; the returned
 * message proof must still indicate handler execution before the channel can be verified.
 */
export async function sendSoulMeshMessage(
  message: SoulMeshMessage,
  options: { endpoint: string; token?: string; transport?: Exclude<SoulHybridTransportKind, 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'REALTIME'> } = {
    endpoint: '',
  },
): Promise<SoulTransportResult> {
  if (!options.endpoint) throw new Error('SOUL_MESH_ENDPOINT_NOT_CONFIGURED');
  if (message.source !== 'N03') throw new Error('N03_TRANSPORT_SOURCE_MISMATCH');
  if (message.target === 'N03') throw new Error('N03_TRANSPORT_SELF_ROUTE');

  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify({ ...message, transport: options.transport ?? 'HTTP' }),
  });

  if (!response.ok) throw new Error(`SOUL_MESH_HTTP_${response.status}`);
  const payload = (await response.json()) as SoulMeshMessage;
  return { response: payload, transport: options.transport ?? 'HTTP' };
}
