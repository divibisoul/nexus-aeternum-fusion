import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { signSoulMeshMessage, verifySoulMeshHmac } from './SoulMeshHmac';

test('N03 verifies the modern 1.1.0 signed message produced by its helper', () => {
  const secret = 'n03-test-secret-123456';
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
  const secret = 'n03-test-secret-123456';
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
