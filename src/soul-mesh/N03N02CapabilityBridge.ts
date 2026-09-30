import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';
import { N02_N03_SYNERGY } from './N02N03Synergy';

/** Capabilities verified in N02/SoulMeshCapabilities.ts on GitHub. */
export const N02_PEER_CAPABILITIES = [
  'cognitive-processing',
  'ai.generate',
  'ai.multimodal',
  'gemini.text.generate',
  'gemini.multimodal.generate',
  'gemini.audio.transcribe',
  'gemini.audio.analyze',
  'gemini.speech.synthesize',
  'mesh.describe',
] as const;

export type N02PeerCapability = (typeof N02_PEER_CAPABILITIES)[number];

/**
 * Real N03→N02 bridge. It reuses the existing Soul Mesh peer transport;
 * it does not introduce another API or transport layer.
 */
export class N03N02CapabilityBridge {
  constructor(private readonly peer = new SoulMeshPeerClient('N03')) {}

  async request(capability: N02PeerCapability, payload: unknown, correlationId?: string) {
    return this.peer.request('N02', capability, payload, correlationId);
  }

  async cognitiveProcess(payload: unknown, correlationId?: string) {
    return this.request('cognitive-processing', payload, correlationId);
  }

  async generate(payload: unknown, correlationId?: string) {
    return this.request('ai.generate', payload, correlationId);
  }

  async multimodal(payload: unknown, correlationId?: string) {
    return this.request('ai.multimodal', payload, correlationId);
  }

  async geminiText(payload: unknown, correlationId?: string) {
    return this.request('gemini.text.generate', payload, correlationId);
  }

  async geminiMultimodal(payload: unknown, correlationId?: string) {
    return this.request('gemini.multimodal.generate', payload, correlationId);
  }

  async geminiTranscribe(payload: unknown, correlationId?: string) {
    return this.request('gemini.audio.transcribe', payload, correlationId);
  }

  async geminiAudioAnalyze(payload: unknown, correlationId?: string) {
    return this.request('gemini.audio.analyze', payload, correlationId);
  }

  async geminiSpeechSynthesize(payload: unknown, correlationId?: string) {
    return this.request('gemini.speech.synthesize', payload, correlationId);
  }

  async describePeer(payload: unknown = {}, correlationId?: string) {
    return this.request('mesh.describe', payload, correlationId);
  }

  synergySnapshot() {
    return N02_N03_SYNERGY;
  }
}
