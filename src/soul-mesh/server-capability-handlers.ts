import type { CapabilityHandlers, SoulMeshMessage } from '../../lib/soul-mesh/endpoint';
import { getN03CapabilityDescriptors } from './N03CapabilityBridge';

const supabaseUrl = () => process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey = () => process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function invokeEdgeFunction(functionName: string, body: Record<string, unknown>, message: SoulMeshMessage): Promise<unknown> {
  const base = supabaseUrl();
  const key = supabaseKey();
  if (!base || !key) throw new Error('SUPABASE_RUNTIME_NOT_CONFIGURED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        apikey: key,
        authorization: `Bearer ${key}`,
        'x-soul-mesh-correlation-id': message.correlationId,
        'x-soul-mesh-source': message.source,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!response.ok) throw new Error(`EDGE_FUNCTION_${functionName}_HTTP_${response.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

const objectInput = (input: unknown): Record<string, unknown> =>
  input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : { input };

export const N03_SERVER_CAPABILITIES: CapabilityHandlers = {
  'mesh.ping': (payload, message) => ({
    ok: true,
    nucleus: 'N03',
    receivedFrom: message.source,
    receivedAt: Date.now(),
    payload,
  }),
  'mesh.describe': () => ({
    nucleus: 'N03',
    protocol: 'soul-mesh/1',
    status: 'online',
    capabilities: getN03CapabilityDescriptors(),
    channels: {
      inbound: ['N03.IN.N01', 'N03.IN.N02', 'N03.IN.N04', 'N03.IN.N05', 'N03.IN.N06'],
      outbound: ['N03.OUT.N01', 'N03.OUT.N02', 'N03.OUT.N04', 'N03.OUT.N05', 'N03.OUT.N06'],
    },
  }),
  'capability.list': () => getN03CapabilityDescriptors(),
  'voice-input': (payload, message) => invokeEdgeFunction('soul-voice-processing', { action: 'speech-to-text', ...objectInput(payload) }, message),
  'speech-processing': (payload, message) => invokeEdgeFunction('soul-voice-processing', { action: 'speech-to-text', ...objectInput(payload) }, message),
  'voice-output': (payload, message) => invokeEdgeFunction('soul-voice-processing', { action: 'text-to-speech', ...objectInput(payload) }, message),
  'emotion-analysis': (payload, message) => invokeEdgeFunction('soul-voice-processing', { action: 'emotional-analysis', ...objectInput(payload) }, message),
  'spiritual-wisdom': (payload, message) => invokeEdgeFunction('soul-spiritual-wisdom', { query: typeof payload === 'string' ? payload : JSON.stringify(payload), context: 'guidance' }, message),
  'plant-knowledge': (payload, message) => invokeEdgeFunction('soul-spiritual-wisdom', { query: typeof payload === 'string' ? payload : JSON.stringify(payload), context: 'plant_medicine' }, message),
  'ritual-knowledge': (payload, message) => invokeEdgeFunction('soul-spiritual-wisdom', { query: typeof payload === 'string' ? payload : JSON.stringify(payload), context: 'ritual' }, message),
  'frequency-context': (payload, message) => invokeEdgeFunction('soul-spiritual-wisdom', { query: typeof payload === 'string' ? payload : JSON.stringify(payload), context: 'frequency' }, message),
  'cognitive-ui': (payload, message) => invokeEdgeFunction('nexus-ai', { input: payload, capability: 'cognitive-ui', correlationId: message.correlationId }, message),
  'multimodal-input': (payload, message) => invokeEdgeFunction('nexus-ai', { input: payload, capability: 'multimodal-input', correlationId: message.correlationId }, message),
  'mesh-communication': (payload) => ({ ok: true, nucleus: 'N03', received: payload }),
};
