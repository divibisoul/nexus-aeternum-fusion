export const SOUL_CAPABILITIES = ['speech.process', 'vision.process', 'web.tools'] as const;
export type SoulCapability = typeof SOUL_CAPABILITIES[number];
