import { createMessage, MESH_PEERS, type SoulMeshMessage, type SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshHttpTransport } from './SoulMeshHttpTransport';

export type N03Peer = Exclude<SoulNucleus, 'N03'>;
const peers = [...MESH_PEERS] as N03Peer[];
const envKey = (peer: N03Peer) => `SOUL_MESH_${peer}_URL`;

export function configuredPeers() {
  return peers.map(nucleus => ({ nucleus, url: (globalThis as any).process?.env?.[envKey(nucleus)]?.trim().replace(/\/$/, '') ?? '' }));
}

export function createN03Request(target: N03Peer, capability: string, payload: unknown): SoulMeshMessage {
  return createMessage({ source: 'N03', target, kind: 'request', capability, payload, correlationId: crypto.randomUUID() });
}

export async function sendFromN03(target: N03Peer, capability: string, payload: unknown, timeoutMs = 15000): Promise<unknown> {
  const peer = configuredPeers().find(item => item.nucleus === target);
  if (!peer?.url) throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);
  const message = createN03Request(target, capability, payload);
  const transport = new SoulMeshHttpTransport();
  const token = (globalThis as any).process?.env?.SOUL_MESH_TOKEN;
  const response = await Promise.race([
    transport.send(`${peer.url}/api/soul-mesh`, message, token),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`SOUL_MESH_TIMEOUT:${target}`)), timeoutMs)),
  ]);
  const body = await response.json() as SoulMeshMessage;
  if (!response.ok || body.correlationId !== message.correlationId || body.source !== target || body.target !== 'N03') {
    throw new Error(`SOUL_MESH_INVALID_RESPONSE:${target}`);
  }
  if (body.kind === 'error') throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}`);
  return body.payload;
}

export async function discoverN03Peer(target: N03Peer) {
  try { return { nucleus: target, reachable: true, description: await sendFromN03(target, 'mesh.describe', { from: 'N03' }) }; }
  catch (error) { return { nucleus: target, reachable: false, error: error instanceof Error ? error.message : String(error) }; }
}

export function discoverAllN03Peers() { return Promise.all(peers.map(discoverN03Peer)); }
