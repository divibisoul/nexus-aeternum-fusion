export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type SoulMeshTransportKind = 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME';
export type SoulMeshProof = 'UNVERIFIED' | 'NEGOTIATING' | 'CONNECTED' | 'EXECUTED' | 'VERIFIED';

export type SoulMeshMessage = {
  protocol: string;
  id: string;
  correlationId: string;
  source: NucleusId;
  target: NucleusId;
  kind: string;
  capability: string;
  payload: unknown;
  timestamp: string | number;
  channelId?: string;
  transport?: SoulMeshTransportKind;
  proof?: SoulMeshProof;
};

function validateChannel(m: SoulMeshMessage) {
  if (!m.channelId) return;
  const expectedOut = `${m.source}.OUT.${m.target}`;
  const expectedIn = `${m.target}.IN.${m.source}`;
  if (m.channelId !== expectedOut && m.channelId !== expectedIn) throw new Error('INVALID_CHANNEL_ID');
}

export function validateMessage(m: SoulMeshMessage, nucleusId: NucleusId) {
  if (m.protocol !== SOUL_MESH_PROTOCOL || m.target !== nucleusId || m.source === m.target || !m.id || !m.correlationId || !m.capability) throw new Error('Invalid Mesh message');
  validateChannel(m);
  return true;
}

export async function handleMeshMessage(m: SoulMeshMessage, nucleusId: NucleusId, handlers: Record<string, (p: unknown) => Promise<unknown> | unknown>) {
  validateMessage(m, nucleusId);
  if (m.kind !== 'request') return m;
  const h = handlers[m.capability];
  if (!h) return { ...m, kind: 'error', proof: 'CONNECTED' as const, payload: { code: 'CAPABILITY_NOT_FOUND' } };
  try {
    return { ...m, kind: 'response', proof: 'EXECUTED' as const, payload: await h(m.payload) };
  } catch (error) {
    return { ...m, kind: 'error', proof: 'EXECUTED' as const, payload: { code: 'CAPABILITY_EXECUTION_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' } };
  }
}
