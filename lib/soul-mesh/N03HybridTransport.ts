import { SoulMeshPeerClient } from './SoulMeshPeerClient';

/** One logical N03 Mesh boundary. Transport details stay behind this adapter. */
export class N03HybridTransport {
  readonly peers = new SoulMeshPeerClient('N03');
  async request(target: Parameters<SoulMeshPeerClient['request']>[0], capability: string, payload: unknown) {
    return this.peers.request(target, capability, payload);
  }
}
