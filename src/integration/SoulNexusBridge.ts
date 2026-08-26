import type { SoulMeshMessage } from '../soul-mesh/SoulMeshProtocol';
import { SoulMeshSupabaseTransport } from '../soul-mesh/SoulMeshSupabaseTransport';
import { nexusCoreProcessor, type NexusCoreCapability } from '../core/NexusCoreProcessor';
import { getN03CapabilityDescriptors } from '../soul-mesh/N03CapabilityBridge';

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
let started = false;

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
  return {
    version: 1,
    requestId: result.id,
    capability: result.capability,
    success: result.success,
    output: result.output,
    error: result.error,
  };
}

export function startSoulNexusBridge(): void {
  if (started) return;
  started = true;

  window.addEventListener('soul:nexus:request', (event) => {
    const request = (event as CustomEvent<SoulNexusRequest>).detail;
    if (!request || request.version !== 1 || !nexusCoreProcessor.isExecutable(request.capability)) return;
    void execute(request).then(publish);
  });

  window.addEventListener('soul:nexus:hello', () => {
    announceSoulNexusCapabilities();
    publishEvent('ready', { capabilities: getN03CapabilityDescriptors() });
  });

  meshTransport = new SoulMeshSupabaseTransport();
  meshUnsubscribe = meshTransport.onMessage(async (message: SoulMeshMessage) => {
    // N03 is the canonical wire identity. 'nexus' remains accepted for backward compatibility.
    if (!['N03', 'nexus'].includes(message.target) || message.kind !== 'request' || !message.capability) return;
    if (!nexusCoreProcessor.isExecutable(message.capability)) {
      await meshTransport!.send({
        protocol: 'soul-mesh/1',
        id: crypto.randomUUID(),
        correlationId: message.correlationId,
        source: 'N03' as SoulMeshMessage['source'],
        target: message.source,
        kind: 'error',
        capability: message.capability,
        payload: { code: 'CAPABILITY_HANDLER_NOT_REGISTERED', nucleus: 'N03' },
        timestamp: Date.now(),
      });
      return;
    }

    const result = await execute({
      version: 1,
      requestId: message.correlationId,
      capability: message.capability as SoulNexusCapability,
      input: message.payload,
    });
    publish(result);

    await meshTransport!.send({
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: message.correlationId,
      source: 'N03' as SoulMeshMessage['source'],
      target: message.source,
      kind: result.success ? 'response' : 'error',
      capability: message.capability,
      payload: result,
      timestamp: Date.now(),
    });
  });

  announceSoulNexusCapabilities();
}

export function stopSoulNexusBridge(): void {
  if (!started) return;
  started = false;
  meshUnsubscribe?.();
  meshUnsubscribe = undefined;
  void meshTransport?.close();
  meshTransport = undefined;
}

export function requestSoulCapability(capability: SoulNexusCapability, input: unknown, context?: Record<string, unknown>): string {
  const requestId = crypto.randomUUID();
  window.dispatchEvent(new CustomEvent('soul:nexus:request', {
    detail: { version: 1, requestId, capability, input, context } satisfies SoulNexusRequest,
  }));
  return requestId;
}

export function publishSoulNexusResult(result: SoulNexusResult): void { publish(result); }

export function announceSoulNexusCapabilities(): void {
  window.dispatchEvent(new CustomEvent('soul:nexus:capabilities', {
    detail: getN03CapabilityDescriptors().map((descriptor) => ({ ...descriptor, available: true })),
  }));
}
