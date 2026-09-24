/** Compatibility facade over the canonical N03 Mesh peer client. */
import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';
import { MESH_PEERS, createSoulMeshMessage, type SoulMeshMessage, type SoulNucleus } from './SoulMeshProtocol';

export type N03Peer = Exclude<SoulNucleus, 'N03'>;
const peers = [...MESH_PEERS] as N03Peer[];
const envKey = (peer: N03Peer) => `SOUL_MESH_${peer}_URL`;
const client = new SoulMeshPeerClient('N03');

export function configuredPeers() {
  return peers.map(nucleus => ({
    nucleus,
    url: process.env[envKey(nucleus)]?.trim().replace(/\/$/, '') ?? '',
  }));
}

export function createN03Request(target: N03Peer, capability: string, payload: unknown): SoulMeshMessage {
  if (target === 'N03') throw new Error('SELF_ROUTE_NOT_ALLOWED');
  return createSoulMeshMessage({
    source: 'N03',
    target,
    kind: 'request',
    capability,
    payload,
    correlationId: crypto.randomUUID(),
    transport: 'HTTP',
    meta: { runtime: 'nexus-aeternum-fusion', transport: 'HTTP', encoding: 'json', version: '1.1.0' },
  });
}

export async function sendFromN03(
  target: N03Peer,
  capability: string,
  payload: unknown,
  timeoutMs = 15_000,
): Promise<unknown> {
  if (!configuredPeers().some(peer => peer.nucleus === target && peer.url)) {
    throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);
  }
  const response = await client.request(
    target,
    capability,
    payload,
    crypto.randomUUID(),
  );
  return response.payload;
}

export async function discoverN03Peer(target: N03Peer) {
  try {
    return {
      nucleus: target,
      reachable: true,
      description: await sendFromN03(target, 'mesh.describe', { from: 'N03' }),
    };
  } catch (error) {
    return {
      nucleus: target,
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function discoverAllN03Peers() {
  return Promise.all(peers.map(discoverN03Peer));
}