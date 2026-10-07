import { createHmac, randomUUID } from 'node:crypto';
import {
  createSoulMeshMessage,
  type SoulMeshMessage,
  type SoulNucleus,
  validateSoulMeshMessage,
} from './SoulMeshProtocol';
import { verifySoulMeshHmac } from '../../src/mesh/SoulMeshHmac';

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

function canonical(message: SoulMeshMessage, nonceValue: string): string {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? '',
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.meta?.transport,
    meta: message.meta ?? null,
    nonce: nonceValue,
  });
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
    if (hmacSecret) {
      headers['x-soul-mesh-nonce'] = nonceValue;
      headers['x-soul-mesh-hmac'] = createHmac('sha256', hmacSecret)
        .update(canonical(message, nonceValue), 'utf8')
        .digest('hex');
    } else if (process.env.SOUL_MESH_TOKEN) {
      headers.authorization = `Bearer ${process.env.SOUL_MESH_TOKEN}`;
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

  async executePublicCapability(
    provider:
      | 'bijux-dag-runtime' | 'ouro-loop' | 'recuris' | 'fedml' | 'hivemind'
      | 'temporal' | 'hora-graph-core' | 'cognitive-workspace' | 'ravana' | 'ray' | 'nats-go',
    operation: string,
    payload: unknown,
    correlationId = randomUUID(),
  ) {
    const normalizedOperation = operation.trim();
    if (!normalizedOperation) throw new Error('PUBLIC_CAPABILITY_OPERATION_REQUIRED');
    const response = await this.request(
      'N07',
      `external.${provider}.execute@1.0.0`,
      { payload, metadata: { provider, external_operation: normalizedOperation } },
      correlationId,
    );
    return { correlationId, payload: response.payload };
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
