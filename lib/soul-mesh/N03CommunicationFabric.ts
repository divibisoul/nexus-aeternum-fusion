import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

export const N03_PEERS: readonly SoulNucleus[] = ['N01', 'N02', 'N04', 'N05', 'N06'];

export type N03TransportKind = 'in-process' | 'webview-bridge' | 'loopback' | 'http' | 'realtime';

export interface N03Transport {
  readonly kind: N03TransportKind;
  send(message: SoulMeshMessage): Promise<void>;
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void;
}

export class N03TransportError extends Error {
  readonly failures: readonly unknown[];

  constructor(failures: readonly unknown[]) {
    super('N03_ALL_TRANSPORTS_FAILED');
    this.name = 'N03TransportError';
    this.failures = failures;
  }
}

/** Transport-independent communication fabric for the N03 AI/runtime. */
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
        failures.push({ transport: transport.kind, error });
      }
    }
    throw new N03TransportError(failures);
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    const subscriptions = this.transports.map((transport) => transport.onMessage(handler));
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }
}
