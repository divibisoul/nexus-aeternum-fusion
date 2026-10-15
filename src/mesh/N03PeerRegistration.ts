import { N03_AUDIO_CAPABILITIES } from './N03AudioCapabilityRegistry';
import { signSoulMeshMessage, verifySoulMeshHmac } from './SoulMeshHmac';

// Historical body-only HMAC signer retained for explicitly configured legacy peers.
async function legacyPayloadHmac(payload: Record<string, unknown>, secret: string): Promise<string> {
  const unsigned = JSON.stringify(payload);
  const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(unsigned));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}


const peers = [
  ['N01', 'SOUL_MESH_N01_URL'],
  ['N02', 'SOUL_MESH_N02_URL'],
  ['N04', 'SOUL_MESH_N04_URL'],
  ['N05', 'SOUL_MESH_N05_URL'],
  ['N06', 'SOUL_MESH_N06_URL'],
  ['N07', 'SOUL_MESH_N07_URL'],
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
  const correlationId = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const payload = {
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
      capabilities: N03_AUDIO_CAPABILITIES.filter(c => c.status === 'implemented').map(c => c.id),
      inChannels: peers.map(([p]) => `N03.IN.${p}`),
      outChannels: peers.map(([p]) => `N03.OUT.${p}`),
    },
    timestamp: Date.now(),
    nonce,
  };
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  let delay = 500;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      // Keep the logical handshake correlation stable, but mint a fresh signed
      // message ID, timestamp and nonce per retry to respect replay protection.
      const attemptNonce = crypto.randomUUID();
      const attemptPayload: Record<string, unknown> = {
        ...payload,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        nonce: attemptNonce,
      };
      let wireMessage: Record<string, unknown> = attemptPayload;
      if (secret) {
        if (process.env.SOUL_MESH_HMAC_LEGACY_PAYLOAD_SIGNING === 'true') {
          wireMessage = { ...attemptPayload, hmac: await legacyPayloadHmac(attemptPayload, secret) };
        } else {
          wireMessage = signSoulMeshMessage(attemptPayload as any, secret) as unknown as Record<string, unknown>;
        }
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(secret ? { 'x-soul-mesh-nonce': attemptNonce, 'x-soul-mesh-hmac': String(wireMessage.hmac ?? '') } : {}) },
        body: JSON.stringify(wireMessage),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await response.json().catch(() => null) as any;
      // A successful HTTP status is insufficient; verify peer identity and signature.
      if (secret && !verifySoulMeshHmac(data, secret)) throw new Error('SOUL_MESH_RESPONSE_HMAC_INVALID');
      if (response.ok && data?.kind === 'response' && data?.correlationId === correlationId && data?.source === peer && data?.target === 'N03') {
        const capabilities = Array.isArray(data.payload?.capabilities) ? data.payload.capabilities.map(String) : [];
        peerState.set(peer, { status: 'healthy', capabilities, lastSeen: Date.now() });
        return;
      }
    } catch { /* bounded retry below; unauthenticated responses never become healthy */ }
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
