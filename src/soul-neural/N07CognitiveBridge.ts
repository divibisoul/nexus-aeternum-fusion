import { createHmac } from 'node:crypto';
import type { SoulMeshMessage } from '../mesh/SoulMeshProtocol';
import { verifySoulMeshHmac } from '../mesh/SoulMeshHmac';

export type CognitiveRequest = { payload: number[]; operation?: string; correlationId?: string; deadlineMs?: number };
export type CognitiveResponse = { traceId: string; correlationId: string; payload?: number[]; data?: unknown; status?: string };

const CONTRACT = '1.1.0' as const;
const PROTOCOL = 'soul-mesh/1' as const;

function env() {
  return process.env;
}
function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replaceAll('-', '')}`;
}
function nonce(): string {
  return crypto.randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
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
function sign(message: SoulMeshMessage, nonceValue: string, secret: string): string {
  return createHmac('sha256', secret).update(canonical(message, nonceValue), 'utf8').digest('hex');
}
export class N07CognitiveBridge {
  constructor(private readonly url: string, private readonly secret: string) {
    if (!url.trim()) throw new Error('SOUL_N07_URL is required');
    if (!secret.trim()) throw new Error('SOUL_MESH_HMAC_SECRET is required');
  }

  async execute(request: CognitiveRequest): Promise<CognitiveResponse> {
    if (!Array.isArray(request.payload) || request.payload.length === 0 || request.payload.some(value => !Number.isFinite(value))) {
      throw new Error('cognitive payload must contain finite numbers');
    }
    const correlationId = request.correlationId?.trim() || id('corr');
    const message: SoulMeshMessage = {
      protocol: PROTOCOL,
      contractVersion: CONTRACT,
      id: id('msg'),
      correlationId,
      source: 'N03',
      target: 'N07',
      kind: 'request',
      capability: request.operation?.trim() || 'cognitive.execute@1.0.0',
      payload: { values: request.payload },
      timestamp: Date.now(),
      meta: {
        runtime: 'nexus-aeternum-fusion',
        transport: 'HTTP',
        encoding: 'json',
        version: CONTRACT,
        nonce: nonce(),
        traceId: correlationId,
      },
    };
    const nonceValue = message.meta?.nonce as string;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-soul-mesh-protocol': PROTOCOL,
      'x-soul-contract-version': CONTRACT,
      'x-soul-correlation-id': correlationId,
      'x-soul-mesh-nonce': nonceValue,
      'x-soul-mesh-hmac': sign(message, nonceValue, this.secret),
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, request.deadlineMs ?? 15_000));
    try {
      const response = await fetch(this.url.replace(/\/$/, '') + '/api/soul-mesh', {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
        signal: controller.signal,
      });
      const body = await response.json() as SoulMeshMessage;
      if (!response.ok) throw new Error(String((body as unknown as Record<string, unknown>).error ?? `N07 Mesh request failed: ${response.status}`));
      if (body.contractVersion !== CONTRACT) throw new Error('N07 Mesh response contract mismatch');
      if (body.correlationId !== correlationId || body.source !== 'N07' || body.target !== 'N03') throw new Error('N07 Mesh response identity mismatch');
      if (!verifySoulMeshHmac(body, this.secret)) throw new Error('N07 Mesh response HMAC invalid');
      const payload = body.payload as Record<string, unknown> | undefined;
      return {
        traceId: body.id,
        correlationId,
        payload: Array.isArray(payload?.values) ? payload.values.map(Number) : undefined,
        data: body.payload,
        status: typeof payload?.status === 'string' ? payload.status : 'ok',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
