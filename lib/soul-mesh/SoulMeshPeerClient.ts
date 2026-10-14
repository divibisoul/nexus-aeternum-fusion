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
    timeoutMs = 15_000,
    retries = 0,
  ): Promise<SoulMeshMessage> {
    const endpoint = this.endpointFor(target);
    if (!endpoint) throw new Error(`MESH_PEER_ENDPOINT_NOT_CONFIGURED:${target}`);
    if (!capability.trim()) throw new Error('MESH_CAPABILITY_REQUIRED');
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('MESH_TIMEOUT_INVALID');

    const resolvedCorrelationId = typeof correlationId === 'string' && correlationId.trim()
      ? correlationId.trim()
      : randomUUID();
    // One operation/message identity is retained across retries; the nonce and timestamp are per-attempt.
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
        traceId: resolvedCorrelationId,
      },
    });
    validateSoulMeshMessage(message);

    const hmacSecret = secret();
    const bearerToken = process.env.SOUL_MESH_TOKEN?.trim() ?? '';
    if (hmacSecret && Buffer.byteLength(hmacSecret, 'utf8') < 32) {
      throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');
    }
    if (!hmacSecret && !bearerToken && process.env.NODE_ENV === 'production') {
      throw new Error(`SOUL_MESH_AUTH_NOT_CONFIGURED:${target}`);
    }

    const retrySafe = new Set([
      'mesh.ping', 'mesh.describe', 'capability.list',
      'sara.health', 'sara.state', 'sara.capabilities', 'sara.trace',
    ]).has(capability);
    const requestedRetries = Number.isFinite(retries) ? Math.trunc(retries) : 0;
    const maxRetries = retrySafe ? Math.max(0, Math.min(3, requestedRetries)) : 0;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const nonceValue = nonce();
      const attemptMessage: SoulMeshMessage = {
        ...message,
        timestamp: Date.now(),
        meta: { ...(message.meta ?? {}), nonce: nonceValue, traceId: resolvedCorrelationId },
      };
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-soul-mesh-protocol': attemptMessage.protocol,
        'x-soul-mesh-contract-version': attemptMessage.contractVersion,
        'x-soul-correlation-id': attemptMessage.correlationId,
      };
      let outbound = attemptMessage;

      if (hmacSecret) {
        const signed = signSoulMeshMessage(attemptMessage, hmacSecret);
        outbound = signed;
        headers['x-soul-mesh-nonce'] = signed.nonce;
        headers['x-soul-mesh-hmac'] = signed.hmac;
      } else if (bearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      }

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(outbound),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
          continue;
        }
        throw error;
      }

      const raw: unknown = await response.json().catch(() => null);
      if (!raw || typeof raw !== 'object') throw new Error('MESH_INVALID_RESPONSE_BODY');
      const body = raw as SoulMeshMessage;
      validateSoulMeshMessage(body);

      if (
        body.correlationId !== attemptMessage.correlationId ||
        body.source !== target ||
        body.target !== this.source
      ) {
        throw new Error('MESH_RESPONSE_CORRELATION_MISMATCH');
      }

      // Verify authenticity before interpreting HTTP status or remote error semantics.
      if (hmacSecret && !verifySoulMeshHmac(body, hmacSecret)) {
        throw new Error('MESH_RESPONSE_HMAC_INVALID');
      }

      if (!response.ok || body.kind === 'error') {
        const remoteError = new Error(`MESH_REMOTE_ERROR:${target}:${response.status}`);
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = remoteError;
          await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
          continue;
        }
        throw remoteError;
      }
      return body;
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'MESH_REQUEST_FAILED'));
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

  async ping(target: Exclude<SoulNucleus, 'N03'>, timeoutMs = 15_000) {
    return this.request(target, 'mesh.ping', {}, undefined, timeoutMs, 1);
  }

  async describe(target: Exclude<SoulNucleus, 'N03'>, timeoutMs = 15_000) {
    return this.request(target, 'mesh.describe', {}, undefined, timeoutMs, 1);
  }

  async listCapabilities(target: Exclude<SoulNucleus, 'N03'>, timeoutMs = 15_000) {
    return this.request(target, 'mesh.describe', {}, undefined, timeoutMs, 1);
  }

  async pingAll(timeoutMs = 15_000) {
    return Promise.all(
      PEERS.map(async (target) => ({
        target,
        result: await this.ping(target, timeoutMs).catch((error) => ({ error: String(error) })),
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
