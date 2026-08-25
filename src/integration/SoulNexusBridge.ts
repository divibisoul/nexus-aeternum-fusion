export type SoulNexusCapability =
  | 'voice-input'
  | 'voice-output'
  | 'multimodal-input'
  | 'cognitive-ui'
  | 'speech-processing';

export interface SoulNexusRequest {
  version: 1;
  requestId: string;
  capability: SoulNexusCapability;
  input: unknown;
  context?: Record<string, unknown>;
}

export interface SoulNexusResult {
  version: 1;
  requestId: string;
  capability: SoulNexusCapability;
  success: boolean;
  output?: unknown;
  error?: { code: string; message: string };
}

const capabilities: SoulNexusCapability[] = [
  'voice-input',
  'voice-output',
  'multimodal-input',
  'cognitive-ui',
  'speech-processing',
];

export function startSoulNexusBridge(): void {
  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !capabilities.includes(request.capability)) return;

    // Nexus reports availability/results; it does not execute Android system controls.
    window.dispatchEvent(new CustomEvent('soul:nexus:result', {
      detail: {
        version: 1,
        requestId: request.requestId,
        capability: request.capability,
        success: true,
        output: { accepted: true, provider: 'nexus-aeternum-fusion' },
      } satisfies SoulNexusResult,
    }));
  });
}

export function announceSoulNexusCapabilities(): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:capabilities', {
    detail: capabilities.map((id) => ({ id, available: true, version: 1, provider: 'nexus-aeternum-fusion' })),
  }));
}
