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
  input: any;
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

const capabilities: SoulNexusCapability[] = ['voice-input','voice-output','multimodal-input','cognitive-ui','speech-processing'];

function publish(result: SoulNexusResult): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:result', { detail: result }));
}

function publishEvent(type: string, data?: unknown): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:event', { detail: { type, data } }));
}

function execute(request: SoulNexusRequest): void {
  try {
    switch (request.capability) {
      case 'voice-output': {
        const text = typeof request.input === 'string' ? request.input : request.input?.text;
        if (!text || !('speechSynthesis' in window)) throw new Error('VOICE_OUTPUT_UNAVAILABLE');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        publish({ version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { spoken: true } });
        return;
      }
      case 'speech-processing': {
        const transcript = request.input?.transcript;
        if (typeof transcript !== 'string') throw new Error('TRANSCRIPT_REQUIRED');
        publish({ version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { transcript: transcript.trim(), language: request.input?.language ?? 'pt-BR' } });
        return;
      }
      case 'multimodal-input': {
        publish({ version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { received: true, mode: request.input?.mode ?? 'input', files: request.input?.files ?? [] } });
        return;
      }
      case 'cognitive-ui': {
        publish({ version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { accepted: true, action: request.input?.action ?? 'unknown' } });
        return;
      }
      case 'voice-input': {
        publish({ version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { received: true, mimeType: request.input?.mimeType } });
        return;
      }
    }
  } catch (error) {
    publish({ version: 1, requestId: request.requestId, capability: request.capability, success: false, error: { code: error instanceof Error ? error.message : 'NEXUS_CAPABILITY_ERROR', message: String(error) } });
  }
}

/** Nexus side of the bidirectional Soul connection. */
export function startSoulNexusBridge(): void {
  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !capabilities.includes(request.capability)) return;
    execute(request);
  });
  window.addEventListener('soul:nexus:hello', () => {
    announceSoulNexusCapabilities();
    publishEvent('ready', { capabilities });
  });
  announceSoulNexusCapabilities();
}

export function requestSoulCapability(capability: SoulNexusCapability, input: unknown, context?: Record<string, unknown>): string {
  const requestId = crypto.randomUUID();
  window.dispatchEvent(new CustomEvent('soul:nexus:request', { detail: { version: 1, requestId, capability, input, context } satisfies SoulNexusRequest }));
  return requestId;
}

export function publishSoulNexusResult(result: SoulNexusResult): void { publish(result); }

export function announceSoulNexusCapabilities(): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:capabilities', { detail: capabilities.map((id) => ({ id, available: true, version: 1, provider: 'nexus-aeternum-fusion' })) }));
}
