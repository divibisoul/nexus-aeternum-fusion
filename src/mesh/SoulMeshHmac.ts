import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SoulMeshMessage } from './SoulMeshProtocol';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const usedNonces = new Map<string, number>();

type WireMessage = SoulMeshMessage & {
  nonce?: string;
  hmac?: string;
  version?: string;
  messageId?: string;
  type?: string;
};

function nonceOf(message: WireMessage): string {
  return String(message.nonce ?? message.meta?.nonce ?? '').trim();
}

/** Canonical 1.1.0 variant used by modern peers that keep nonce in meta. */
function canonicalModernWithMeta(message: WireMessage, nonceValue: string): string {
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
    meta: message.meta ?? null,
    nonce: nonceValue,
  });
}

/** Compatibility variant used by legacy/current registration relays with top-level nonce and no meta. */
function canonicalModernTopLevel(message: WireMessage, nonceValue: string): string {
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
    nonce: nonceValue,
  });
}

/** Compatibility variant retained for legacy N03↔N07 cognitive bridge envelopes. */
function canonicalLegacy(message: WireMessage, nonceValue: string): string {
  return JSON.stringify({
    version: message.version ?? '1.0',
    contractVersion: message.contractVersion,
    messageId: message.messageId ?? message.id ?? '',
    source: message.source,
    target: message.target,
    timestamp: message.timestamp,
    nonce: nonceValue,
    correlationId: message.correlationId,
    type: message.type ?? (message.kind === 'error' ? 'ERROR' : 'TASK_RESULT'),
    payload: {
      capability: message.capability ?? '',
      payload: message.payload ?? {},
    },
  });
}

function signaturesFor(message: WireMessage, secret: string, nonceValue: string): string[] {
  return [
    canonicalModernWithMeta(message, nonceValue),
    canonicalModernTopLevel(message, nonceValue),
    canonicalLegacy(message, nonceValue),
  ].map((value) => createHmac('sha256', secret).update(value).digest('hex'));
}

export function signSoulMeshMessage(message: SoulMeshMessage, secret: string): SoulMeshMessage & { nonce: string; hmac: string } {
  if (!secret) throw new Error('SOUL_MESH_HMAC_SECRET_REQUIRED');
  const signed = { ...message, nonce: crypto.randomUUID() } as WireMessage;
  const canonical = canonicalModernWithMeta(signed, signed.nonce);
  return { ...signed, hmac: createHmac('sha256', secret).update(canonical).digest('hex') };
}

export function verifySoulMeshHmac(message: SoulMeshMessage, secret: string, now = Date.now()): boolean {
  const wire = message as WireMessage;
  if (!secret) return false;
  const nonce = nonceOf(wire);
  const supplied = String(wire.hmac ?? '').trim();
  if (!nonce || !supplied || !/^[0-9a-f]{64}$/i.test(supplied)) return false;
  if (!Number.isFinite(wire.timestamp) || Math.abs(now - wire.timestamp) > MAX_CLOCK_SKEW_MS) return false;

  const key = `${wire.source}:${nonce}`;
  const previous = usedNonces.get(key);
  if (previous !== undefined && now - previous <= MAX_CLOCK_SKEW_MS) return false;

  const candidates = signaturesFor(wire, secret, nonce);
  const suppliedBuffer = Buffer.from(supplied, 'hex');
  const valid = candidates.some((expected) => {
    const expectedBuffer = Buffer.from(expected, 'hex');
    return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
  });
  if (!valid) return false;

  usedNonces.set(key, now);
  for (const [nonceKey, seenAt] of usedNonces) {
    if (now - seenAt > MAX_CLOCK_SKEW_MS) usedNonces.delete(nonceKey);
  }
  return true;
}
