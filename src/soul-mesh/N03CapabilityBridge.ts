import { supabase } from '@/integrations/supabase/client';
import type { NexusCoreCapability } from '@/core/NexusCoreProcessor';

type CapabilityInput = {
  input: unknown;
  context?: Record<string, unknown>;
};

type InvokeResult = { output: unknown };

async function invoke(functionName: string, body: Record<string, unknown>): Promise<InvokeResult> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw error;
  return { output: data };
}

function objectInput(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) return input as Record<string, unknown>;
  return { input };
}

export const N03_CAPABILITIES: readonly NexusCoreCapability[] = [
  'voice-input', 'voice-output', 'speech-processing', 'multimodal-input',
  'cognitive-ui', 'emotion-analysis', 'spiritual-wisdom', 'plant-knowledge',
  'ritual-knowledge', 'frequency-context', 'mesh-communication',
] as const;

export async function executeN03Capability(capability: NexusCoreCapability, request: CapabilityInput): Promise<unknown> {
  switch (capability) {
    case 'voice-input':
    case 'speech-processing':
      return (await invoke('soul-voice-processing', { action: 'speech-to-text', ...objectInput(request.input) })).output;
    case 'voice-output':
      return (await invoke('soul-voice-processing', { action: 'text-to-speech', ...objectInput(request.input) })).output;
    case 'emotion-analysis':
      return (await invoke('soul-voice-processing', { action: 'emotional-analysis', ...objectInput(request.input) })).output;
    case 'spiritual-wisdom':
    case 'plant-knowledge':
    case 'ritual-knowledge':
    case 'frequency-context': {
      const context = capability === 'plant-knowledge' ? 'plant_medicine'
        : capability === 'ritual-knowledge' ? 'ritual'
        : capability === 'frequency-context' ? 'frequency'
        : (request.context?.context ?? 'guidance');
      return (await invoke('soul-spiritual-wisdom', {
        query: typeof request.input === 'string' ? request.input : JSON.stringify(request.input),
        context,
        emotional_state: request.context?.emotional_state,
        user_level: request.context?.user_level ?? 'intermediate',
      })).output;
    }
    case 'cognitive-ui':
    case 'multimodal-input':
      return (await invoke('nexus-ai', { input: request.input, context: request.context ?? {}, capability })).output;
    case 'mesh-communication':
      return { accepted: true, capability, input: request.input };
    default:
      throw new Error(`N03 capability handler not implemented: ${String(capability)}`);
  }
}

export function getN03CapabilityDescriptors() {
  return N03_CAPABILITIES.map((id) => ({
    id,
    version: 1,
    nucleus: 'N03',
    provider: 'nexus-aeternum-fusion',
    transport: 'soul-mesh/1',
    executable: true,
  }));
}
