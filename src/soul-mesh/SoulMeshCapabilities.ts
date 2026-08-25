export type SoulMeshCapability = { id: string; version: string; description: string; request: boolean; response: boolean; events: boolean };
export const SOUL_MESH_CAPABILITIES: SoulMeshCapability[] = [{ id: 'cognitive-ui', version: '1.0', description: 'Cognitive interaction and UI services', request: true, response: true, events: true }];
