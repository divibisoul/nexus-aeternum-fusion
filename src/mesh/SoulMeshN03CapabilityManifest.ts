import type { SoulNucleus } from './SoulMeshProtocol';

export interface N03CapabilityDescriptor {
  id: string;
  version: '1.0';
  nucleus: 'N03';
  kind: 'local';
  input: string[];
  output: string[];
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  privacy: number;
  cost: number;
  dependencies: string[];
}

export const N03_CAPABILITIES: readonly N03CapabilityDescriptor[] = [
  { id: 'audio.transcribe', version: '1.0', nucleus: 'N03', kind: 'local', input: ['audio/*'], output: ['text/plain'], status: 'AVAILABLE', privacy: 1, cost: 0, dependencies: [] },
  { id: 'audio.analyze.emotion', version: '1.0', nucleus: 'N03', kind: 'local', input: ['audio/*'], output: ['application/json'], status: 'AVAILABLE', privacy: 1, cost: 0, dependencies: ['audio.transcribe'] },
  { id: 'speech.synthesize', version: '1.0', nucleus: 'N03', kind: 'local', input: ['text/plain'], output: ['audio/*'], status: 'AVAILABLE', privacy: 1, cost: 0, dependencies: [] },
];

export const N03_MESH_PEERS: readonly Exclude<SoulNucleus, 'N03'>[] = ['N01', 'N02', 'N04', 'N05', 'N06'];

export function getN03CapabilityManifest() {
  return { node: 'N03' as const, protocol: 'soul-mesh/1' as const, contractVersion: '1.1.0' as const, capabilities: N03_CAPABILITIES, peers: N03_MESH_PEERS };
}
