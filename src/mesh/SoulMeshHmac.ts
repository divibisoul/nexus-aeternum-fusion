import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SoulMeshMessage } from './SoulMeshProtocol';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const usedNonces = new Map<string, number>();

function canonical(message: SoulMeshMessage): string {
  return JSON.stringify({
    protocol: message.protocol,
    version: message.version,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability,
    payload: message.payload,
    timestamp: message.timestamp,
    nonce: message.nonce,
  });
}

function signature(message: SoulMeshMessage, secret: string): string {
  return createHmac('sha256', secret).update(canonical(message)).digest('hex');
}

export function signSoulMeshMessage(message: SoulMeshMessage, secret: string): SoulMeshMessage {
  if (!secret) throw new Error('SOUL_MESH_HMAC_SECRET_REQUIRED');
  const signed = { ...message, nonce: crypto.randomUUID() };
  return { ...signed, hmac: signature(signed, secret) };
}

export function verifySoulMeshHmac(message: SoulMeshMessage, secret: string, now = Date.now()): boolean {
  if (!secret || !message.nonce || !message.hmac) return false;
  if (!Number.isFinite(message.timestamp) || Math.abs(now - message.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  const key = `${message.source}:${message.nonce}`;
  const previous = usedNonces.get(key);
  if (previous !== undefined && now - previous <= MAX_CLOCK_SKEW_MS) return false;
  const expected = Buffer.from(signature(message, secret), 'hex');
  const supplied = Buffer.from(message.hmac, 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  usedNonces.set(key, now);
  for (const [nonceKey, seenAt] of usedNonces) if (now - seenAt > MAX_CLOCK_SKEW_MS) usedNonces.delete(nonceKey);
  return true;
}
