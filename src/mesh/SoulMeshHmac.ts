import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SoulMeshMessage } from './SoulMeshProtocol';

const MAX_CLOCK_SKEW_MS = 30_000;
const usedNonces = new Map<string, number>();

function canonical(message: SoulMeshMessage, nonce: string): string {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.meta?.transport ?? null,
    meta: message.meta ?? null,
    nonce,
  });
}

function signature(message: SoulMeshMessage, secret: string, nonce: string): string {
  return createHmac('sha256', secret).update(canonical(message, nonce), 'utf8').digest('hex');
}

export function signSoulMeshMessage(message: SoulMeshMessage, secret: string): SoulMeshMessage & { nonce: string; hmac: string } {
  if (!secret) throw new Error('SOUL_MESH_HMAC_SECRET_REQUIRED');
  const nonce = crypto.randomUUID();
  return { ...message, nonce, hmac: signature(message, secret, nonce) };
}

export function verifySoulMeshHmac(message: SoulMeshMessage, secret: string, now = Date.now()): boolean {
  if (!secret || !message.nonce || !message.hmac) return false;
  if (!Number.isFinite(message.timestamp) || Math.abs(now - message.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  const key = `${message.source}:${message.nonce}`;
  const previous = usedNonces.get(key);
  if (previous !== undefined && now - previous <= MAX_CLOCK_SKEW_MS) return false;
  const expected = Buffer.from(signature(message, secret, message.nonce), 'hex');
  const supplied = Buffer.from(message.hmac, 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  usedNonces.set(key, now);
  for (const [nonceKey, seenAt] of usedNonces) if (now - seenAt > MAX_CLOCK_SKEW_MS) usedNonces.delete(nonceKey);
  return true;
}