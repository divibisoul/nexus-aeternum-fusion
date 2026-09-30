import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';
import { N02_N03_SYNERGY } from './N02N03Synergy';
import { analyzeEmotion, summarizeAudio, synthesizeSpeech, transcribeAudio, translateAudio, identifySpeakers } from './GeminiAudioAdapter';

/** Capabilities verified in N02/SoulMeshCapabilities.ts on GitHub. */
export const N02_PEER_CAPABILITIES = [
  'cognitive-processing',
  'ai.generate',
  'ai.multimodal',
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
    return this.generate(payload, correlationId);
  }

  async geminiMultimodal(payload: unknown, correlationId?: string) {
    return this.multimodal(payload, correlationId);
  }

  async geminiTranscribe(payload: unknown, _correlationId?: string) {
    const value = payload as { audioBase64?: string; mimeType?: string; model?: string; prompt?: string; diarization?: boolean; wordTimestamp?: boolean };
    return { nucleus: 'N03', capability: 'audio.transcribe', transcript: await transcribeAudio(value?.audioBase64 || '', value?.mimeType || '', value) };
  }

  async geminiAudioAnalyze(payload: unknown, _correlationId?: string) {
    const value = payload as { audioBase64?: string; mimeType?: string };
    return { nucleus: 'N03', capability: 'audio.analyze.emotion', analysis: await analyzeEmotion(value?.audioBase64 || '', value?.mimeType || '') };
  }

  async geminiAudioSummarize(payload: unknown, _correlationId?: string) {
    const value = payload as { audioBase64?: string; mimeType?: string };
    return { nucleus: 'N03', capability: 'audio.summarize', summary: await summarizeAudio(value?.audioBase64 || '', value?.mimeType || '') };
  }

  async geminiAudioTranslate(payload: unknown, _correlationId?: string) {
    const value = payload as { audioBase64?: string; mimeType?: string; targetLanguage?: string };
    return { nucleus: 'N03', capability: 'speech.translate', ...(await translateAudio(value?.audioBase64 || '', value?.mimeType || '', value?.targetLanguage)) };
  }

  async geminiSpeakerIdentify(payload: unknown, _correlationId?: string) {
    const value = payload as { audioBase64?: string; mimeType?: string };
    return { nucleus: 'N03', capability: 'speaker.identify', transcript: await identifySpeakers(value?.audioBase64 || '', value?.mimeType || '') };
  }

  async geminiSpeechSynthesize(payload: unknown, _correlationId?: string) {
    const value = payload as { text?: string; voice?: string };
    return { nucleus: 'N03', capability: 'speech.synthesize', ...(await synthesizeSpeech(value?.text || '', value?.voice)) };
  }

  async describePeer(payload: unknown = {}, correlationId?: string) {
    return this.request('mesh.describe', payload, correlationId);
  }

  synergySnapshot() {
    return N02_N03_SYNERGY;
  }
}
