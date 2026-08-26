export type SoulMeshCapability = { id: string; version: string; description: string; request: boolean; response: boolean; events: boolean };

/**
 * Capabilities exposed by Nucleus 03. These describe existing project
 * functions plus the processor boundary; they do not require a provider API.
 */
export const SOUL_MESH_CAPABILITIES: SoulMeshCapability[] = [
  { id: 'cognitive-ui', version: '1.1', description: 'Cognitive interaction and UI services', request: true, response: true, events: true },
  { id: 'voice-input', version: '1.0', description: 'Voice/audio input handling', request: true, response: true, events: true },
  { id: 'voice-output', version: '1.0', description: 'Voice output handling', request: true, response: true, events: true },
  { id: 'speech-processing', version: '1.0', description: 'Speech processing orchestration', request: true, response: true, events: true },
  { id: 'multimodal-input', version: '1.0', description: 'Multimodal input orchestration', request: true, response: true, events: true },
  { id: 'emotion-analysis', version: '1.0', description: 'Emotion-state analysis pipeline', request: true, response: true, events: true },
  { id: 'spiritual-wisdom', version: '1.0', description: 'Existing spiritual knowledge domain', request: true, response: true, events: true },
  { id: 'plant-knowledge', version: '1.0', description: 'Existing plant and ethnobotanical knowledge domain', request: true, response: true, events: true },
  { id: 'ritual-knowledge', version: '1.0', description: 'Existing ritual and contemplative knowledge domain', request: true, response: true, events: true },
  { id: 'frequency-context', version: '1.0', description: 'Existing frequency/context knowledge domain', request: true, response: true, events: true },
  { id: 'mesh-communication', version: '1.0', description: 'Nucleus 03 mesh communication orchestration', request: true, response: true, events: true },
];
