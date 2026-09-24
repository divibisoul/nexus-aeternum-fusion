/** Compatibility facade over the canonical N03 Mesh peer client. */
import { SoulMeshPeerClient } from './SoulMeshPeerClient';
import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

export type NucleusId = SoulNucleus;
export type MeshKind = SoulMeshMessage['kind'];
export type MeshMessage = SoulMeshMessage;

const PEERS: Exclude<NucleusId, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06', 'N07'];
const client = new SoulMeshPeerClient('N03');

export const sendTo = (
  target: NucleusId,
  capability: string,
  payload: unknown,
  timeoutMs = 15_000,
  _retries = 1,
): Promise<MeshMessage> => {
  if (target === 'N03') throw new Error('SELF_ROUTE_NOT_ALLOWED');
  return client.request(target, capability, payload, undefined, timeoutMs);
};

export const requestPeerCapability = sendTo;

export const describePeer = (target: NucleusId, timeoutMs = 10_000): Promise<MeshMessage> => {
  if (target === 'N03') throw new Error('SELF_ROUTE_NOT_ALLOWED');
  return client.request(target, 'mesh.describe', { from: 'N03', intent: 'capability-discovery' });
};

export async function pingAll(timeoutMs = 5_000) {
  return Promise.all(PEERS.map(async target => {
    try {
      return {
        target,
        status: 'CONNECTED' as const,
        response: await client.request(target, 'mesh.ping', { from: 'N03', channel: `N03.OUT.${target}` }),
      };
    } catch (error) {
      return { target, status: 'FAILED' as const, error: String(error) };
    }
  }));
}

export const N03_OUT_CHANNELS = PEERS.map(peer => `N03.OUT.${peer}`);
export const N03_IN_CHANNELS = PEERS.map(peer => `N03.IN.${peer}`);
