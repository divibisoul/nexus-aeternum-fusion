import { randomUUID } from 'node:crypto';
import { SoulMeshPeerClient } from './SoulMeshPeerClient';

export const N03_SUPERGPU_MESH_CAPABILITY = 'mesh.supergpu.execute@1.0.0' as const;
const client = new SoulMeshPeerClient('N03');

export async function requestN07SuperGPU(
  values: number[],
  operation = 'identity',
  device?: string,
  correlationId = randomUUID(),
) {
  if (!Array.isArray(values) || values.length === 0 || values.some(value => !Number.isFinite(value))) {
    throw new Error('SUPERGPU_VALUES_INVALID');
  }
  if (!operation.trim()) throw new Error('SUPERGPU_OPERATION_REQUIRED');
  return client.request('N07', N03_SUPERGPU_MESH_CAPABILITY, {
    values,
    metadata: { operation, ...(device?.trim() ? { device: device.trim() } : {}) },
  }, correlationId);
}
