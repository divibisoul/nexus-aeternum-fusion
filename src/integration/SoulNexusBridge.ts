import type { SoulMeshMessage } from '../mesh/SoulMeshProtocol';
import { SoulMeshSupabaseTransport } from '../soul-mesh/SoulMeshSupabaseTransport';
import { nexusCoreProcessor, type NexusCoreCapability } from '../core/NexusCoreProcessor';

export type SoulNexusCapability = NexusCoreCapability;

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

let meshTransport: SoulMeshSupabaseTransport | undefined;
let meshUnsubscribe: (() => void) | undefined;

function publish(result: SoulNexusResult): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:result', { detail: result }));
}

function publishEvent(type: string, data?: unknown): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:event', { detail: { type, data } }));
}

async function execute(request: SoulNexusRequest): Promise<SoulNexusResult> {
  const result = await nexusCoreProcessor.process({
    id: request.requestId,
    capability: request.capability,
    input: request.input,
    context: request.context,
  });
  return { version: 1, requestId: result.id, capability: result.capability, success: result.success, output: result.output, error: result.error };
}

/** Starts the real Nexus ↔ Soul Mesh bridge while keeping the existing local event API. */
export function startSoulNexusBridge(): void {
  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !nexusCoreProcessor.hasCapability(request.capability)) return;
    void execute(request).then(publish);
  });

  window.addEventListener('soul:nexus:hello', () => {
    announceSoulNexusCapabilities();
    publishEvent('ready', { capabilities: nexusCoreProcessor.getCapabilities() });
  });

  if (!meshTransport) {
    meshTransport = new SoulMeshSupabaseTransport();
    meshUnsubscribe = meshTransport.onMessage(async (message: SoulMeshMessage) => {
      if (message.target !== 'nexus' || message.kind !== 'request' || !message.capability || !nexusCoreProcessor.hasCapability(message.capability)) return;
      const result = await execute({
        version: 1,
        requestId: message.correlationId,
        capability: message.capability,
        input: message.payload,
      });
      publish(result);
      await meshTransport!.send({
        protocol: 'soul-mesh/1',
        id: crypto.randomUUID(),
        correlationId: message.correlationId,
        source: 'nexus',
        target: message.source,
        kind: result.success ? 'response' : 'error',
        capability: message.capability,
        payload: result,
        timestamp: Date.now(),
      });
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
  window.dispatchEvent(new CustomEvent('soul:nexus:capabilities', {
    detail: nexusCoreProcessor.getCapabilities().map((id) => ({ id, available: true, version: 1, provider: 'nexus-aeternum-fusion' })),
  }));
}
