export const N03_PERCEPTION_CAPABILITIES = [
  'perception.analyzeImage',
  'perception.processAudio',
  'perception.analyzeMultimodal',
] as const;

export type N03PerceptionCapability = typeof N03_PERCEPTION_CAPABILITIES[number];
