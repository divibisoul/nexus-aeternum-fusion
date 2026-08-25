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

/** Nexus transport only: it exposes Nexus capabilities without duplicating Android controls. */
export function startSoulNexusBridge(): void {
  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !capabilities.includes(request.capability)) return;
    window.dispatchEvent(new CustomEvent('soul:nexus:capability-request', { detail: request }));
  });
}

export function requestSoulCapability(
  capability: SoulNexusCapability,
  input: unknown,
  context?: Record<string, unknown>,
): string {
  const requestId = crypto.randomUUID();
  const request: SoulNexusRequest = { version: 1, requestId, capability, input, context };
  window.dispatchEvent(new CustomEvent('soul:nexus:request', { detail: request }));
  return requestId;
}

export function publishSoulNexusResult(result: SoulNexusResult): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:result', { detail: result }));
}

export function announceSoulNexusCapabilities(): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:capabilities', {
    detail: capabilities.map((id) => ({ id, available: true, version: 1, provider: 'nexus-aeternum-fusion' })),
  }));
}
