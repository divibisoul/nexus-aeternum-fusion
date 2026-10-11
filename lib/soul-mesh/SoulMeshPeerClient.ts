import { randomUUID } from 'node:crypto';
import {
  createSoulMeshMessage,
  type SoulMeshMessage,
  type SoulNucleus,
  validateSoulMeshMessage,
} from './SoulMeshProtocol';
import { signSoulMeshMessage, verifySoulMeshHmac } from '../../src/mesh/SoulMeshHmac';

const PEERS: Exclude<SoulNucleus, 'N03'>[] = [
  'N01',
  'N02',
  'N04',
  'N05',
  'N06',
  'N07',
];

function secret() {
  return process.env.SOUL_MESH_HMAC_SECRET?.trim() ?? '';
}

function nonce() {
  return randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
}


export class SoulMeshPeerClient {
  constructor(private readonly source: SoulNucleus = 'N03') {}

  endpointFor(target: Exclude<SoulNucleus, 'N03'>): string | undefined {
    return process.env[`SOUL_MESH_${target}_URL`];
  }

  async request(
    target: Exclude<SoulNucleus, 'N03'>,
    capability: string,
    payload: unknown,
    correlationId?: string,
  ): Promise<SoulMeshMessage> {
    const endpoint = this.endpointFor(target);
    if (!endpoint) {
      throw new Error(`MESH_PEER_ENDPOINT_NOT_CONFIGURED:${target}`);
    }
    if (!capability.trim()) {
      throw new Error('MESH_CAPABILITY_REQUIRED');
    }

    const nonceValue = nonce();
    const resolvedCorrelationId = typeof correlationId === 'string' && correlationId.trim() ? correlationId.trim() : randomUUID();
    const message = createSoulMeshMessage({
      source: this.source,
      target,
      kind: 'request',
      capability,
      payload,
      correlationId: resolvedCorrelationId,
      meta: {
        runtime: 'nexus-aeternum-fusion',
        transport: 'HTTP',
        encoding: 'json',
        version: '1.1.0',
        nonce: nonceValue,
        traceId: resolvedCorrelationId,
      },
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
    const bearerToken = process.env.SOUL_MESH_TOKEN?.trim() ?? '';
    if (hmacSecret) {
      if (Buffer.byteLength(hmacSecret, 'utf8') < 32) throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');
      const signed = signSoulMeshMessage(message, hmacSecret);
      message.nonce = signed.nonce;
      message.hmac = signed.hmac;
      message.meta = signed.meta;
      headers['x-soul-mesh-nonce'] = signed.nonce;
      headers['x-soul-mesh-hmac'] = signed.hmac;
    } else if (bearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error(`SOUL_MESH_AUTH_NOT_CONFIGURED:${target}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000),
    });

    const body = (await response.json()) as SoulMeshMessage;
    validateSoulMeshMessage(body);

    if (
      body.correlationId !== message.correlationId ||
      body.source !== target ||
      body.target !== this.source
    ) {
      throw new Error('MESH_RESPONSE_CORRELATION_MISMATCH');
    }

    if (!response.ok || body.kind === 'error') {
      throw new Error(`MESH_REMOTE_ERROR:${target}:${response.status}`);
    }

    if (hmacSecret && !verifySoulMeshHmac(body, hmacSecret)) {
      throw new Error('MESH_RESPONSE_HMAC_INVALID');
    }

    return body;
  }

  async superGPUExecute(values: number[], operation = 'identity', device?: string, correlationId = randomUUID()) {
    if (!Array.isArray(values) || values.length === 0 || values.some(value => !Number.isFinite(value))) {
      throw new Error('SUPERGPU_VALUES_INVALID');
    }
    const metadata: Record<string, unknown> = { operation };
    if (device?.trim()) metadata.device = device.trim();
    const response = await this.request('N07', 'supergpu.execute', { payload: { values }, metadata }, correlationId);
    return { correlationId, payload: response.payload };
  }

  async superGPUParallel(tasks: SuperGPUTask[], correlationId = randomUUID()) {
    if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('SUPERGPU_TASKS_REQUIRED');
    const response = await this.request('N07', 'supergpu.parallel', { payload: { tasks } }, correlationId);
    return { correlationId, payload: response.payload };
  }

  async ping(target: Exclude<SoulNucleus, 'N03'>) {
    return this.request(target, 'mesh.ping', {});
  }

  async describe(target: Exclude<SoulNucleus, 'N03'>) {
    return this.request(target, 'mesh.describe', {});
  }

  async listCapabilities(target: Exclude<SoulNucleus, 'N03'>) {
    return this.request(target, 'mesh.describe', {});
  }

  async pingAll() {
    return Promise.all(
      PEERS.map(async (target) => ({
        target,
        result: await this.ping(target).catch((error) => ({ error: String(error) })),
      })),
    );
  }
}

export type SuperGPUTask = {
  id?: string;
  capability: string;
  payload: Record<string, unknown>;
  required?: boolean;
  timeout_ms?: number;
};
