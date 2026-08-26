import type { SoulNucleus } from './SoulMeshProtocol';
import { N03_PEERS, N03TransportKind } from './N03CommunicationFabric';

export const N03_COMMUNICATION_MANIFEST = {
  nucleus: 'N03' as SoulNucleus,
  protocol: 'soul-mesh/1' as const,
  peers: N03_PEERS,
  inbound: true,
  outbound: true,
  transports: ['in-process', 'webview-bridge', 'loopback', 'http', 'realtime'] as readonly N03TransportKind[],
  policy: 'transport-agnostic-with-fallback',
  runtimeOwnership: 'N03-runtime',
} as const;
