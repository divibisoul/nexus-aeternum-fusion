import { createHmac, randomUUID } from 'node:crypto';
import { createSoulMeshMessage, type SoulMeshMessage, type SoulNucleus, validateSoulMeshMessage } from './SoulMeshProtocol';

const PEERS: Exclude<SoulNucleus, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06', 'N07'];

function secret() { return process.env.SOUL_MESH_HMAC_SECRET?.trim() ?? ''; }
function nonce() { return randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32); }
function canonical(message: SoulMeshMessage, nonceValue: string): string {
  return JSON.stringify({
    protocol: message.protocol, contractVersion: message.contractVersion, id: message.id, correlationId: message.correlationId,
    source: message.source, target: message.target, kind: message.kind, capability: message.capability ?? null,
    payload: message.payload, timestamp: message.timestamp, transport: message.transport ?? null, meta: message.meta ?? null, nonce: nonceValue,
  });
}

export class SoulMeshPeerClient {
  constructor(private readonly source: SoulNucleus = 'N03') {}

  endpointFor(target: Exclude<SoulNucleus, 'N03'>): string | undefined {
    return process.env[`SOUL_MESH_${target}_URL`];
  }

  async request(target: Exclude<SoulNucleus, 'N03'>, capability: string, payload: unknown, correlationId = randomUUID()): Promise<SoulMeshMessage> {
    const endpoint = this.endpointFor(target);
    if (!endpoint) throw new Error(`MESH_PEER_ENDPOINT_NOT_CONFIGURED:${target}`);
    const nonceValue = nonce();
    const message = createSoulMeshMessage({
      source: this.source,
      target,
      kind: 'request',
      capability,
      payload,
      correlationId,
      transport: 'HTTP',
      meta: { runtime: 'nexus-aeternum-fusion', transport: 'HTTP', encoding: 'json', version: '1.1.0', nonce: nonceValue, traceId: correlationId },
    });
    validateSoulMeshMessage(message);

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-soul-mesh-protocol': message.protocol,
      'x-soul-mesh-contract-version': message.contractVersion,
      'x-soul-correlation-id': message.correlationId,
    };
    const hmacSecret = secret();
    if (hmacSecret) {
      headers['x-soul-mesh-nonce'] = nonceValue;
      headers['x-soul-mesh-hmac'] = createHmac('sha256', hmacSecret).update(canonical(message, nonceValue), 'utf8').digest('hex');
    }

    const response = await fetch(endpoint, {
      method: 'POST', headers, body: JSON.stringify(message), signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json() as SoulMeshMessage;
    validateSoulMeshMessage(body);
    if (body.correlationId !== message.correlationId || body.source !== target || body.target !== this.source) throw new Error('MESH_RESPONSE_CORRELATION_MISMATCH');
    if (!response.ok || body.kind === 'error') throw new Error(`MESH_REMOTE_ERROR:${response.status}`);
    return body;
  }

  async ping(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'mesh.ping', {}); }
  async describe(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'mesh.describe', {}); }
  async listCapabilities(target: Exclude<SoulNucleus, 'N03'>) { return this.request(target, 'mesh.describe', {}); }
  async pingAll() { return Promise.all(PEERS.map(async target => ({ target, result: await this.ping(target).catch(error => ({ error: String(error) })) }))); }
}
