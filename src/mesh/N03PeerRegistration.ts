import { createHmac } from 'node:crypto';
import { N03_AUDIO_CAPABILITIES } from './N03AudioCapabilityRegistry';

const peers = [
  ['N01', 'SOUL_MESH_N01_URL'],
  ['N02', 'SOUL_MESH_N02_URL'],
  ['N04', 'SOUL_MESH_N04_URL'],
  ['N05', 'SOUL_MESH_N05_URL'],
  ['N06', 'SOUL_MESH_N06_URL'],
  ['N07', 'SOUL_MESH_N07_URL'],
] as const;

let registrationStarted = false;
const peerState = new Map<string, {
  status: 'healthy' | 'unavailable';
  capabilities: string[];
  lastSeen: number;
}>();

export function getPeerState(peer: string) {
  return peerState.get(peer);
}

function canonical(message: Record<string, unknown>, nonce: string): string {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.transport ?? null,
    meta: message.meta ?? null,
    nonce,
  });
}

function sign(message: Record<string, unknown>, nonce: string, secret: string): string {
  return createHmac('sha256', secret).update(canonical(message, nonce), 'utf8').digest('hex');
}

async function register(peer: string, envName: string) {
  const url = process.env[envName];
  if (!url) {
    peerState.set(peer, { status: 'unavailable', capabilities: [], lastSeen: 0 });
    return;
  }

  const endpoint = `${url.replace(/\/$/, '')}/api/soul-mesh`;
  const correlationId = crypto.randomUUID();
  const nonce = crypto.randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
  const message: Record<string, unknown> = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: crypto.randomUUID(),
    correlationId,
    source: 'N03',
    target: peer,
    kind: 'request',
    capability: 'mesh.handshake',
    payload: {
      nucleus: 'N03',
      capabilities: N03_AUDIO_CAPABILITIES.map(c => c.id),
      executableCapabilities: N03_AUDIO_CAPABILITIES.filter(c => c.status === 'implemented').map(c => c.id),
      inChannels: peers.map(([p]) => `N03.IN.${p}`),
      outChannels: peers.map(([p]) => `N03.OUT.${p}`),
    },
    timestamp: Date.now(),
    transport: 'HTTP',
    meta: {
      runtime: 'nexus-aeternum-fusion',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      nonce,
      traceId: correlationId,
    },
  };

  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (secret) {
    headers['x-soul-mesh-nonce'] = nonce;
    headers['x-soul-mesh-hmac'] = sign(message, nonce, secret);
  } else if (process.env.SOUL_MESH_TOKEN?.trim()) {
    headers.authorization = `Bearer ${process.env.SOUL_MESH_TOKEN.trim()}`;
  } else if (process.env.NODE_ENV === 'production') {
    peerState.set(peer, { status: 'unavailable', capabilities: [], lastSeen: 0 });
    return;
  }

  let delay = 500;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await response.json().catch(() => null) as any;
      if (response.ok && data?.kind === 'response' && data?.correlationId === correlationId && data?.source === peer && data?.target === 'N03') {
        const capabilities = Array.isArray(data.payload?.executableCapabilities)
          ? data.payload.executableCapabilities.map(String)
          : Array.isArray(data.payload?.capabilities)
            ? data.payload.capabilities.map(String)
            : [];
        peerState.set(peer, { status: 'healthy', capabilities, lastSeen: Date.now() });
        return;
      }
    } catch {
      // bounded retry below
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }

  peerState.set(peer, { status: 'unavailable', capabilities: [], lastSeen: 0 });
}

export function startN03PeerRegistration() {
  if (registrationStarted || typeof window !== 'undefined') return;
  registrationStarted = true;
  void Promise.all(peers.map(([peer, env]) => register(peer, env)));
}
