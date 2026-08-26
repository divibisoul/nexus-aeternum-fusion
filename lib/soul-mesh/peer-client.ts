import type { MeshMessage, NucleusId } from './endpoint';

export type { NucleusId } from './endpoint';
export type MeshKind = MeshMessage['kind'];

const PEERS: Exclude<NucleusId, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06'];
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
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

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const validPeer = (target: NucleusId): target is Exclude<NucleusId, 'N03'> => PEERS.includes(target as Exclude<NucleusId, 'N03'>);

export async function sendTo(target: Exclude<NucleusId, 'N03'>, capability: string, payload: unknown, timeoutMs = 15000): Promise<MeshMessage> {
  if (!validPeer(target)) throw new Error('SOUL_MESH_INVALID_PEER');
  if (!capability?.trim()) throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 250 || timeoutMs > 120000) throw new Error('SOUL_MESH_INVALID_TIMEOUT');

  const url = urls[target];
  if (!url) throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`SOUL_MESH_UNSUPPORTED_URL:${target}`);

  const correlationId = uuid();
  const message: MeshMessage = {
    protocol: 'soul-mesh/1', id: uuid(), correlationId, source: 'N03', target,
    kind: 'request', capability, payload, timestamp: Date.now(),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = tokens[target];
    const response = await fetch(parsed, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { throw new Error(`SOUL_MESH_INVALID_JSON:${target}`); }
    if (!body || typeof body !== 'object') throw new Error(`SOUL_MESH_INVALID_RESPONSE:${target}`);
    const result = body as Partial<MeshMessage>;
    if (result.protocol !== 'soul-mesh/1' || result.correlationId !== correlationId || result.target !== 'N03' || result.source !== target) {
      throw new Error(`SOUL_MESH_RESPONSE_VALIDATION_FAILED:${target}`);
    }
    if (result.kind === 'error' || !response.ok) {
      throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}:${result.capability ?? capability}`);
    }
    return result as MeshMessage;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(`SOUL_MESH_TIMEOUT:${target}`);
    throw error;
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
    const startedAt = Date.now();
    try {
      const response = await sendTo(target, 'mesh.ping', { from: 'N03', channel: `N03.OUT.${target}` }, timeoutMs);
      return { target, status: 'CONNECTED' as const, latencyMs: Date.now() - startedAt, response };
    } catch (error) {
      return { target, status: 'FAILED' as const, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.message : String(error) };
    }
  }));
}

export async function healthMatrix(timeoutMs = 5000) {
  const results = await Promise.all(PEERS.map(async (target) => {
    try {
      const response = await sendTo(target, 'mesh.describe', { from: 'N03' }, timeoutMs);
      return { target, reachable: true, response };
    } catch (error) {
      return { target, reachable: false, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  return { nucleus: 'N03' as const, checkedAt: Date.now(), peers: results };
}

export const N03_OUT_CHANNELS = PEERS.map((x) => `N03.OUT.${x}`);
export const N03_IN_CHANNELS = PEERS.map((x) => `N03.IN.${x}`);
