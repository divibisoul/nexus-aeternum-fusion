export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type MeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';
export type MeshMessage = {
  protocol: 'soul-mesh/1';
  id: string;
  correlationId: string;
  source: NucleusId;
  target: NucleusId;
  kind: MeshKind;
  capability: string;
  payload: unknown;
  timestamp: number;
};

const PEERS: Exclude<NucleusId, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06'];
const env = (globalThis as any).process?.env ?? {};
const urls: Partial<Record<NucleusId, string>> = {
  N01: env.SOUL_MESH_N01_URL,
  N02: env.SOUL_MESH_N02_URL,
  N04: env.SOUL_MESH_N04_URL,
  N05: env.SOUL_MESH_N05_URL,
  N06: env.SOUL_MESH_N06_URL,
};
const tokens: Partial<Record<NucleusId, string>> = {
  N01: env.SOUL_MESH_N01_TOKEN,
  N02: env.SOUL_MESH_N02_TOKEN,
  N04: env.SOUL_MESH_N04_TOKEN,
  N05: env.SOUL_MESH_N05_TOKEN,
  N06: env.SOUL_MESH_N06_TOKEN,
};
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export async function sendTo(target: NucleusId, capability: string, payload: unknown, timeoutMs = 15000): Promise<MeshMessage> {
  if (target === 'N03') throw new Error('SOUL_MESH_SELF_ROUTE_NOT_ALLOWED');
  const url = urls[target];
  if (!url) throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);

  const correlationId = uuid();
  const message: MeshMessage = { protocol: 'soul-mesh/1', id: uuid(), correlationId, source: 'N03', target, kind: 'request', capability, payload, timestamp: Date.now() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = tokens[target];
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    const body = await response.json() as MeshMessage;
    if (body.correlationId !== correlationId) throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
    if (!response.ok || body.kind === 'error') throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}:${body.capability ?? capability}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestPeerCapability(target: Exclude<NucleusId, 'N03'>, capability: string, payload: unknown, timeoutMs = 15000) {
  return sendTo(target, capability, payload, timeoutMs);
}

export async function describePeer(target: Exclude<NucleusId, 'N03'>, timeoutMs = 5000) {
  return sendTo(target, 'mesh.describe', { from: 'N03' }, timeoutMs);
}

export async function pingAll(timeoutMs = 5000) {
  return Promise.all(PEERS.map(async (target) => {
    try {
      return { target, status: 'CONNECTED' as const, response: await sendTo(target, 'mesh.ping', { from: 'N03', channel: `N03.OUT.${target}` }, timeoutMs) };
    } catch (error) {
      return { target, status: 'FAILED' as const, error: String(error) };
    }
  }));
}

export const N03_OUT_CHANNELS = PEERS.map((x) => `N03.OUT.${x}`);
export const N03_IN_CHANNELS = PEERS.map((x) => `N03.IN.${x}`);
