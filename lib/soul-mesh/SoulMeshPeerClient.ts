import { randomUUID } from 'node:crypto';
import { SOUL_MESH_PROTOCOL, SoulMeshMessage, SoulNucleus, validateSoulMeshMessage } from './SoulMeshProtocol';

const peers: Exclude<SoulNucleus, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06'];

export class SoulMeshPeerClient {
  constructor(private readonly source: SoulNucleus = 'N03') {}

  endpointFor(target: Exclude<SoulNucleus, 'N03'>): string | undefined {
    return process.env[`SOUL_MESH_${target}_URL`];
  }

  async request(target: Exclude<SoulNucleus, 'N03'>, capability: string, payload: unknown): Promise<SoulMeshMessage> {
    const endpoint = this.endpointFor(target);
    if (!endpoint) throw new Error(`MESH_PEER_ENDPOINT_NOT_CONFIGURED:${target}`);
    const message: SoulMeshMessage = {
      protocol: SOUL_MESH_PROTOCOL,
      id: randomUUID(), correlationId: randomUUID(), source: this.source, target,
      kind: 'request', capability, payload, timestamp: Date.now(),
    };
    validateSoulMeshMessage(message);
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', 'x-soul-mesh-protocol': SOUL_MESH_PROTOCOL },
      body: JSON.stringify(message), signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json() as SoulMeshMessage;
    validateSoulMeshMessage(body);
    if (body.correlationId !== message.correlationId || body.source !== target || body.target !== this.source) throw new Error('MESH_RESPONSE_CORRELATION_MISMATCH');
    if (!response.ok) throw new Error(`MESH_REMOTE_ERROR:${response.status}`);
    return body;
  }

  async ping(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'mesh.ping', {}); }
  async describe(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'mesh.describe', {}); }
  async listCapabilities(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'capability.list', {}); }
  async pingAll() { return Promise.all(peers.map(async target => ({ target, result: await this.ping(target).catch(error => ({ error: String(error) })) }))); }
}
