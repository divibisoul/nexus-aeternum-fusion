import { randomUUID } from 'node:crypto';
import {
  SoulMeshPeerClient,
  type SuperGPUTask,
} from './SoulMeshPeerClient';

export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06' | 'N07';
export type MeshKind = 'request' | 'response' | 'event' | 'error';
export type MeshMessage = {
  protocol: 'soul-mesh/1';
  contractVersion: '1.1.0';
  id: string;
  correlationId: string;
  source: NucleusId;
  target: NucleusId;
  kind: MeshKind;
  capability: string;
  payload: unknown;
  timestamp: number;
  nonce?: string;
  hmac?: string;
  meta?: Record<string, unknown>;
};

/**
 * Legacy compatibility surface.
 * The previous standalone N03 peer implementation is preserved as an alias
 * over the canonical SoulMeshPeerClient so N03 has one runtime Mesh path.
 */
const client = new SoulMeshPeerClient('N03');

export const sendTo = async (
  target: Exclude<NucleusId, 'N03'>,
  capability: string,
  payload: unknown,
  timeoutMs = 15000,
  _retries = 1,
): Promise<MeshMessage> => {
  void _retries;
  const result = await client.request(target, capability, payload);
  return result as MeshMessage;
};

export const requestPeerCapability = sendTo;

export const describePeer = async (
  target: Exclude<NucleusId, 'N03'>,
  timeoutMs = 10000,
) => {
  void timeoutMs;
  return client.describe(target);
};

export const requestPeerTool = async (
  target: Exclude<NucleusId, 'N03'>,
  toolCapability: string,
  payload: unknown,
  timeoutMs = 15000,
) => {
  void timeoutMs;
  return sendTo(target, toolCapability, payload);
};

export const executePublicCapability = (
  provider:
    | 'bijux-dag-runtime' | 'ouro-loop' | 'recuris' | 'fedml' | 'hivemind'
    | 'temporal' | 'hora-graph-core' | 'cognitive-workspace' | 'ravana' | 'ray' | 'nats-go',
  operation: string,
  payload: unknown,
  correlationId = randomUUID(),
) => client.executePublicCapability(provider, operation, payload, correlationId);

export async function pingAll(timeoutMs = 5000) {
  void timeoutMs;
  const peers: Exclude<NucleusId, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06', 'N07'];
  return Promise.all(
    peers.map(async target => {
      try {
        return { target, status: 'CONNECTED' as const, response: await client.ping(target) };
      } catch (error) {
        return { target, status: 'FAILED' as const, error: String(error) };
      }
    }),
  );
}

export const N03_OUT_CHANNELS = ['N03.OUT.N01','N03.OUT.N02','N03.OUT.N04','N03.OUT.N05','N03.OUT.N06','N03.OUT.N07'];
export const N03_IN_CHANNELS = ['N03.IN.N01','N03.IN.N02','N03.IN.N04','N03.IN.N05','N03.IN.N06','N03.IN.N07'];
export type { SuperGPUTask };
