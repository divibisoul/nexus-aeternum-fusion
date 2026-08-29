import { N03_AUDIO_CAPABILITIES } from './N03AudioCapabilityRegistry';

const peers = [
  ['N01', 'SOUL_MESH_N01_URL'],
  ['N02', 'SOUL_MESH_N02_URL'],
  ['N04', 'SOUL_MESH_N04_URL'],
  ['N05', 'SOUL_MESH_N05_URL'],
  ['N06', 'SOUL_MESH_N06_URL'],
] as const;
let registrationStarted = false;
const tokens = new Map<string, string>();

export function getPeerToken(peer: string) { return tokens.get(peer); }

async function register(peer: string, envName: string) {
  const url = process.env[envName];
  if (!url) return;
  const payload = {
    nucleus: 'N03',
    endpoint: process.env.SOUL_MESH_N03_URL || '',
    capabilities: N03_AUDIO_CAPABILITIES.map(c => c.id),
    inChannels: peers.map(([p]) => `N03.IN.${p}`),
    outChannels: peers.map(([p]) => `N03.OUT.${p}`),
    protocol: 'soul-mesh/1',
    version: '1.1.0',
  };
  let delay = 500;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/soul-mesh/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000) });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.token) tokens.set(peer, String(data.token));
        return;
      }
    } catch { /* retry below */ }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }
}

export function startN03PeerRegistration() {
  if (registrationStarted || typeof window !== 'undefined') return;
  registrationStarted = true;
  void Promise.all(peers.map(([peer, env]) => register(peer, env)));
}
