import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { signSoulMeshMessage, verifySoulMeshHmac } from './SoulMeshHmac';

test('N03 verifies the modern 1.1.0 signed message produced by its helper', () => {
  const secret = '01234567890123456789012345678901';
  const message = {
    protocol: 'soul-mesh/1' as const,
    contractVersion: '1.1.0' as const,
    id: 'n03-message',
    correlationId: 'n03-correlation',
    source: 'N02' as const,
    target: 'N03' as const,
    kind: 'request' as const,
    capability: 'audio.transcribe',
    payload: { value: 'test' },
    timestamp: Date.now(),
  };
  const signed = signSoulMeshMessage(message, secret);
  assert.equal(verifySoulMeshHmac(signed, secret), true);
  assert.equal(verifySoulMeshHmac(signed, secret), false);
});

test('N03 verifies retained top-level nonce modern registration envelopes', () => {
  const secret = '01234567890123456789012345678901';
  const nonce = '0123456789abcdef0123456789abcdef';
  const message = {
    protocol: 'soul-mesh/1' as const,
    contractVersion: '1.1.0' as const,
    id: 'n03-registration',
    correlationId: 'n03-registration-correlation',
    source: 'N01' as const,
    target: 'N03' as const,
    kind: 'request' as const,
    capability: 'mesh.handshake',
    payload: { nucleus: 'N01' },
    timestamp: Date.now(),
    nonce,
  };
  const unsigned = JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability,
    payload: message.payload,
    timestamp: message.timestamp,
    nonce,
  });
  const hmac = createHmac('sha256', secret).update(unsigned).digest('hex');
  const signed = { ...message, hmac };
  assert.equal(verifySoulMeshHmac(signed, secret), true);
});

test('N03 rejects HMAC keys below the shared 32-byte Mesh minimum', () => {
  const secret = 'short-n03-key';
  const message = {
    protocol: 'soul-mesh/1' as const,
    contractVersion: '1.1.0' as const,
    id: 'n03-short-key',
    correlationId: 'n03-short-key-correlation',
    source: 'N02' as const,
    target: 'N03' as const,
    kind: 'request' as const,
    capability: 'audio.transcribe',
    payload: { value: 'test' },
    timestamp: Date.now(),
  };
  assert.throws(() => signSoulMeshMessage(message, secret), /SOUL_MESH_HMAC_SECRET_TOO_SHORT/);
  assert.equal(verifySoulMeshHmac({ ...message, nonce: '01234567890123456789012345678901', hmac: '0'.repeat(64) }, secret), false);
});

test('N03 canonical HMAC includes transport projection required by N07 1.1.0', () => {
  const secret = '01234567890123456789012345678901';
  const message = {
    protocol: 'soul-mesh/1' as const,
    contractVersion: '1.1.0' as const,
    id: 'n03-canonical-contract',
    correlationId: 'n03-canonical-correlation',
    source: 'N03' as const,
    target: 'N07' as const,
    kind: 'request' as const,
    capability: 'supergpu.execute',
    payload: { values: [1, 2] },
    timestamp: Date.now(),
    meta: { transport: 'HTTP', nonce: 'n03canonicalnonce' },
  };
  const signed = signSoulMeshMessage(message, secret);
  const unsigned = JSON.stringify({
    protocol: signed.protocol,
    contractVersion: signed.contractVersion,
    id: signed.id,
    correlationId: signed.correlationId,
    source: signed.source,
    target: signed.target,
    kind: signed.kind,
    capability: signed.capability ?? null,
    payload: signed.payload,
    timestamp: signed.timestamp,
    transport: signed.meta?.transport,
    meta: signed.meta ?? null,
    nonce: signed.nonce,
  });
  const expected = createHmac('sha256', secret).update(unsigned).digest('hex');
  assert.equal(signed.hmac, expected);
  assert.equal(verifySoulMeshHmac(signed, secret), true);
});
