import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

export const N03_PEERS: readonly SoulNucleus[] = ['N01', 'N02', 'N04', 'N05', 'N06'];

export type N03TransportKind = 'in-process' | 'webview-bridge' | 'loopback' | 'http' | 'realtime';

export interface N03Transport {
  readonly kind: N03TransportKind;
  send(message: SoulMeshMessage): Promise<void>;
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void;
}

/**
 * N03 communication fabric: keeps transport independent from the N03 AI/runtime.
 * It provides deterministic peer routing and fallback without requiring an
 * external AI API. The runtime remains the owner/executor of capabilities.
 */
export class N03CommunicationFabric {
  readonly nucleus: SoulNucleus = 'N03';

  constructor(private readonly transports: readonly N03Transport[]) {}

  peers(): readonly SoulNucleus[] {
    return N03_PEERS;
  }

  async send(message: SoulMeshMessage): Promise<void> {
    if (message.source !== this.nucleus) throw new Error('N03_INVALID_SOURCE');
    if (!N03_PEERS.includes(message.target)) throw new Error(`N03_INVALID_PEER:${message.target}`);

    const failures: unknown[] = [];
    for (const transport of this.transports) {
      try {
        await transport.send(message);
        return;
      } catch (error) {
        failures.push(error);
      }
    }
    throw new AggregateError(failures, 'N03_ALL_TRANSPORTS_FAILED');
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    const subscriptions = this.transports.map((transport) => transport.onMessage(handler));
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }
}
