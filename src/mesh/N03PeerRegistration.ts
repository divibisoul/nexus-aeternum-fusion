import { N03_AUDIO_CAPABILITIES } from './N03AudioCapabilityRegistry';

const peers = [
  ['N01', 'SOUL_MESH_N01_URL'],
  ['N02', 'SOUL_MESH_N02_URL'],
  ['N04', 'SOUL_MESH_N04_URL'],
  ['N05', 'SOUL_MESH_N05_URL'],
  ['N06', 'SOUL_MESH_N06_URL'],
] as const;
let registrationStarted = false;
const peerState = new Map<string, { status: 'healthy' | 'unavailable'; capabilities: string[]; lastSeen: number }>();

export function getPeerState(peer: string) { return peerState.get(peer); }

async function register(peer: string, envName: string) {
  const url = process.env[envName];
  if (!url) {
    peerState.set(peer, { status: 'unavailable', capabilities: [], lastSeen: 0 });
    return;
  }
  const endpoint = `${url.replace(/\/$/, '')}/api/soul-mesh`;
  const payload = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    source: 'N03',
    target: peer,
    kind: 'request',
    capability: 'mesh.handshake',
    payload: {
      nucleus: 'N03',
      capabilities: N03_AUDIO_CAPABILITIES.map(c => c.id),
      inChannels: peers.map(([p]) => `N03.IN.${p}`),
      outChannels: peers.map(([p]) => `N03.OUT.${p}`),
    },
    timestamp: Date.now(),
  };
  let delay = 500;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await response.json().catch(() => null) as any;
      if (response.ok && data?.kind === 'response' && data?.correlationId === payload.correlationId && data?.source === peer && data?.target === 'N03') {
        const capabilities = Array.isArray(data.payload?.capabilities) ? data.payload.capabilities.map(String) : [];
        peerState.set(peer, { status: 'healthy', capabilities, lastSeen: Date.now() });
        return;
      }
    } catch { /* bounded retry below */ }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }
  peerState.set(peer, { status: 'unavailable', capabilities: [], lastSeen: Date.now() });
}

export function startN03PeerRegistration() {
  if (registrationStarted || typeof window !== 'undefined') return;
  registrationStarted = true;
  void Promise.all(peers.map(([peer, env]) => register(peer, env)));
}
