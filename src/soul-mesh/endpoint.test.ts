import { describe, expect, it } from 'bun:test';
import {
  createSoulMeshMessage,
  SOUL_MESH_PROTOCOL as canonicalProtocol,
  validateSoulMeshMessage,
} from '../../lib/soul-mesh/SoulMeshProtocol';
import { handleMeshMessage as handleSourceFacade } from './endpoint';
import {
  handleMeshMessage as handleLibFacade,
  validateMeshMessage as validateLegacyFacade,
  SOUL_MESH_PROTOCOL as facadeProtocol,
} from '../../lib/soul-mesh/endpoint';

describe('N03 Mesh endpoint compatibility facades', () => {
  it('uses the canonical protocol authority and returns a proper correlated response', async () => {
    expect(facadeProtocol).toBe(canonicalProtocol);
    const request = createSoulMeshMessage({
      source: 'N01', target: 'N03', kind: 'request', capability: 'mesh.ping',
      correlationId: 'n03-facade-correlation', payload: { probe: true },
    });
    const response = await handleSourceFacade(request, 'N03', {
      'mesh.ping': () => ({ ok: true, nucleus: 'N03' }),
    });
    validateSoulMeshMessage(response);
    expect(response.kind).toBe('response');
    expect(response.source).toBe('N03');
    expect(response.target).toBe('N01');
    expect(response.correlationId).toBe(request.correlationId);
  });

  it('preserves the legacy ack and string-timestamp input through the adapter', async () => {
    const legacyAck = {
      protocol: canonicalProtocol, contractVersion: '1.1.0', id: 'legacy-ack-id',
      correlationId: 'legacy-ack-correlation', source: 'N01', target: 'N03', kind: 'ack',
      capability: 'mesh.ping', payload: { acknowledged: true }, timestamp: new Date().toISOString(),
    } as const;
    expect(validateLegacyFacade(legacyAck as never)).toBe(true);
    const returned = await handleLibFacade(legacyAck as never, {});
    expect(returned.kind).toBe('ack');
    expect(returned.correlationId).toBe(legacyAck.correlationId);
  });
});
