import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';
import { N02_N03_SYNERGY } from './N02N03Synergy';

/** Capabilities verified in N02/SoulMeshCapabilities.ts on GitHub. */
export const N02_PEER_CAPABILITIES = [
  'cognitive-processing',
  'ai.generate',
  'ai.multimodal',
  'mesh.describe',
] as const;

export type N02PeerCapability = (typeof N02_PEER_CAPABILITIES)[number];

/**
 * Real N03→N02 bridge. It reuses the existing Soul Mesh peer transport;
 * it does not introduce another API or transport layer.
 */
export class N03N02CapabilityBridge {
  constructor(private readonly peer = new SoulMeshPeerClient('N03')) {}

  async request(capability: N02PeerCapability, payload: unknown) {
    return this.peer.request('N02', capability, payload);
  }

  async cognitiveProcess(payload: unknown) {
    return this.request('cognitive-processing', payload);
  }

  async generate(payload: unknown) {
    return this.request('ai.generate', payload);
  }

  async multimodal(payload: unknown) {
    return this.request('ai.multimodal', payload);
  }

  async describePeer(payload: unknown = {}) {
    return this.request('mesh.describe', payload);
  }

  synergySnapshot() {
    return N02_N03_SYNERGY;
  }
}
