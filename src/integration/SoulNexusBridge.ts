import type { SoulMeshMessage } from '../soul-mesh/SoulMeshProtocol';
import { SoulMeshSupabaseTransport } from '../soul-mesh/SoulMeshSupabaseTransport';

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
let meshTransport: SoulMeshSupabaseTransport | undefined;
let meshUnsubscribe: (() => void) | undefined;

function publish(result: SoulNexusResult): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:result', { detail: result }));
}

function publishEvent(type: string, data?: unknown): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:event', { detail: { type, data } }));
}

function execute(request: SoulNexusRequest): SoulNexusResult {
  try {
    switch (request.capability) {
      case 'voice-output': {
        const text = typeof request.input === 'string' ? request.input : request.input?.text;
        if (!text || !('speechSynthesis' in window)) throw new Error('VOICE_OUTPUT_UNAVAILABLE');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        return { version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { spoken: true } };
      }
      case 'speech-processing': {
        const transcript = request.input?.transcript;
        if (typeof transcript !== 'string') throw new Error('TRANSCRIPT_REQUIRED');
        return { version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { transcript: transcript.trim(), language: request.input?.language ?? 'pt-BR' } };
      }
      case 'multimodal-input':
        return { version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { received: true, mode: request.input?.mode ?? 'input', files: request.input?.files ?? [] } };
      case 'cognitive-ui':
        return { version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { accepted: true, action: request.input?.action ?? 'unknown' } };
      case 'voice-input':
        return { version: 1, requestId: request.requestId, capability: request.capability, success: true, output: { received: true, mimeType: request.input?.mimeType } };
    }
  } catch (error) {
    return { version: 1, requestId: request.requestId, capability: request.capability, success: false, error: { code: error instanceof Error ? error.message : 'NEXUS_CAPABILITY_ERROR', message: String(error) } };
  }
}

/** Starts the real Nexus ↔ Soul Mesh bridge and retains the existing local event API. */
export function startSoulNexusBridge(): void {
  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !capabilities.includes(request.capability)) return;
    const result = execute(request);
    publish(result);
  });

  window.addEventListener('soul:nexus:hello', () => {
    announceSoulNexusCapabilities();
    publishEvent('ready', { capabilities });
  });

  if (!meshTransport) {
    meshTransport = new SoulMeshSupabaseTransport();
    meshUnsubscribe = meshTransport.onMessage(async (message: SoulMeshMessage) => {
      if (message.target !== 'nexus' || message.kind !== 'request' || !message.capability || !capabilities.includes(message.capability as SoulNexusCapability)) return;
      const request: SoulNexusRequest = { version: 1, requestId: message.correlationId, capability: message.capability as SoulNexusCapability, input: message.payload, context: typeof message.payload === 'object' && message.payload !== null ? (message.payload as { context?: Record<string, unknown> }).context : undefined };
      const result = execute(request);
      publish(result);
      await meshTransport!.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: 'nexus', target: message.source, kind: result.success ? 'response' : 'error', capability: message.capability, payload: result, timestamp: Date.now() });
    });
  }

  announceSoulNexusCapabilities();
}

export function stopSoulNexusBridge(): void {
  meshUnsubscribe?.();
  meshUnsubscribe = undefined;
  void meshTransport?.close();
  meshTransport = undefined;
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
