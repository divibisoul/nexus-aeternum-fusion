import { supabase } from '@/integrations/supabase/client';
import type { NexusCoreCapability } from '@/core/NexusCoreProcessor';

type CapabilityInput = {
  input: unknown;
  context?: Record<string, unknown>;
};

type InvokeResult = {
  output: unknown;
};

async function invoke(functionName: string, body: Record<string, unknown>): Promise<InvokeResult> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw error;
  return { output: data };
}

export const N03_CAPABILITIES: readonly NexusCoreCapability[] = [
  'voice-input',
  'voice-output',
  'speech-processing',
  'multimodal-input',
  'cognitive-ui',
  'emotion-analysis',
  'spiritual-wisdom',
  'plant-knowledge',
  'ritual-knowledge',
  'frequency-context',
  'mesh-communication',
] as const;

export async function executeN03Capability(capability: NexusCoreCapability, request: CapabilityInput): Promise<unknown> {
  switch (capability) {
    case 'voice-input':
    case 'speech-processing': {
      const { output } = await invoke('soul-voice-processing', { action: 'speech-to-text', ...(request.input as Record<string, unknown>) });
      return output;
    }
    case 'voice-output': {
      const { output } = await invoke('soul-voice-processing', { action: 'text-to-speech', ...(request.input as Record<string, unknown>) });
      return output;
    }
    case 'emotion-analysis': {
      const { output } = await invoke('soul-voice-processing', { action: 'emotional-analysis', ...(request.input as Record<string, unknown>) });
      return output;
    }
    case 'spiritual-wisdom':
    case 'plant-knowledge':
    case 'ritual-knowledge':
    case 'frequency-context': {
      const context = capability === 'plant-knowledge' ? 'plant_medicine'
        : capability === 'ritual-knowledge' ? 'ritual'
        : capability === 'frequency-context' ? 'frequency'
        : (request.context?.context ?? 'guidance');
      const { output } = await invoke('soul-spiritual-wisdom', {
        query: request.input,
        context,
        emotional_state: request.context?.emotional_state,
        user_level: request.context?.user_level ?? 'intermediate',
      });
      return output;
    }
    case 'cognitive-ui':
    case 'multimodal-input': {
      const { output } = await invoke('nexus-ai', {
        input: request.input,
        context: request.context ?? {},
        capability,
      });
      return output;
    }
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
