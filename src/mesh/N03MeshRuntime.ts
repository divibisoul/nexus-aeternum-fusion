import { analyzeEmotion, synthesizeSpeech, summarizeAudio, transcribeAudio, translateAudio, identifySpeakers } from './GeminiAudioAdapter';
import { N03_AUDIO_CAPABILITIES } from './N03AudioCapabilityRegistry';
import { SoulMeshRouter } from './SoulMeshRouter';
import { describeWhisperAdapter, isWhisperAdapterExecutable, transcribeWithWhisper } from './WhisperAdapter';
import { describeKokoroAdapter, isKokoroAdapterExecutable, synthesizeWithKokoro } from './KokoroAdapter';
import { N03_RESIDENT_AGENT } from './N03ResidentAgent';

export const N03_NUCLEUS_ID = 'N03' as const;

export const declaredN03Capabilities = () => [
  'mesh.handshake',
  'mesh.ping',
  'mesh.describe',
  'mesh.resident.describe@1.0.0',
  'capability.list',
  'sara.health',
  'sara.cycle',
  'sara.audit',
  'sara.regenerate',
  'sara.state',
  'sara.capabilities',
  'sara.trace',
  ...N03_AUDIO_CAPABILITIES.map(capability => capability.id),
];

function audioInput(payload: unknown): { data: string; mimeType: string } {
  if (!payload || typeof payload !== 'object') throw new Error('AUDIO_DATA_AND_MIME_TYPE_REQUIRED');
  const value = payload as Record<string, unknown>;
  if (!value.data || !value.mimeType) throw new Error('AUDIO_DATA_AND_MIME_TYPE_REQUIRED');
  return { data: String(value.data), mimeType: String(value.mimeType) };
}

function registerWhisper(router: SoulMeshRouter): void {
  if (!isWhisperAdapterExecutable()) return;
  router.register('audio.transcribe.whisper@1.0.0', async message => {
    const a = audioInput(message.payload);
    const value = message.payload as Record<string, unknown>;
    return transcribeWithWhisper({
      data: a.data,
      mimeType: a.mimeType,
      language: typeof value.language === 'string' ? value.language : undefined,
      task: value.task === 'translate' ? 'translate' : 'transcribe',
      wordTimestamps: value.wordTimestamps === true,
      initialPrompt: typeof value.initialPrompt === 'string' ? value.initialPrompt : undefined,
    });
  });
}

function registerKokoro(router: SoulMeshRouter): void {
  if (!isKokoroAdapterExecutable()) return;
  router.register('speech.synthesize.kokoro@1.0.0', async message => {
    const value = message.payload as Record<string, unknown>;
    const text = String(value?.text || '');
    return synthesizeWithKokoro({
      text,
      language: typeof value?.language === 'string' ? value.language : undefined,
      voice: typeof value?.voice === 'string' ? value.voice : undefined,
      speed: typeof value?.speed === 'number' ? value.speed : undefined,
      device: typeof value?.device === 'string' ? value.device : undefined,
    });
  });
}

export function createN03MeshRouter(): SoulMeshRouter {
  const router = new SoulMeshRouter();

  router.register('mesh.handshake', message => ({
    nucleus: N03_NUCLEUS_ID,
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    capabilities: declaredN03Capabilities(),
    transports: ['http'],
    timestamp: Date.now(),
    echoCorrelationId: message.correlationId,
  }));

  router.register('audio.transcribe', async message => {
    const a = audioInput(message.payload);
    return { text: await transcribeAudio(a.data, a.mimeType), provider: 'gemini' };
  });

  router.register('audio.analyze.emotion', async message => {
    const a = audioInput(message.payload);
    return { analysis: await analyzeEmotion(a.data, a.mimeType), provider: 'gemini' };
  });

  router.register('audio.summarize', async message => {
    const a = audioInput(message.payload);
    return { summary: await summarizeAudio(a.data, a.mimeType), provider: 'gemini' };
  });

  router.register('speech.translate', async message => {
    const a = audioInput(message.payload);
    const value = message.payload as Record<string, unknown>;
    const targetLanguage = typeof value.targetLanguage === 'string' && value.targetLanguage.trim()
      ? value.targetLanguage
      : 'Português do Brasil';
    return { ...(await translateAudio(a.data, a.mimeType, targetLanguage)), provider: 'gemini' };
  });

  router.register('speaker.identify', async message => {
    const a = audioInput(message.payload);
    return { transcript: await identifySpeakers(a.data, a.mimeType), provider: 'gemini' };
  });

  router.register('speech.synthesize', async message => {
    const value = message.payload as Record<string, unknown>;
    const text = String(value?.text || '');
    if (!text.trim()) throw new Error('TEXT_REQUIRED');
    const audio = await synthesizeSpeech(text, String(value?.voice || 'Kore'));
    return { audio, provider: 'gemini' };
  });

  router.register('mesh.resident.describe@1.0.0', () => ({
    ...N03_RESIDENT_AGENT,
    whisper: describeWhisperAdapter(),
    kokoro: describeKokoroAdapter(),
  }));

  router.register('mesh.ping', message => ({
    ok: true,
    handler: 'N03.mesh.ping',
    echoed: message.payload,
    processedAt: Date.now(),
  }));

  router.register('mesh.describe', () => {
    const agents = router.listAgents();
    return {
      nucleus: N03_NUCLEUS_ID,
      declaredCapabilities: declaredN03Capabilities(),
      executableCapabilities: [...new Set(agents.flatMap(agent => agent.capabilities))],
      agents,
      residentAgent: N03_RESIDENT_AGENT,
      whisper: describeWhisperAdapter(),
      kokoro: describeKokoroAdapter(),
      status: 'online',
      contractVersion: '1.1.0',
    };
  });

  router.register('capability.list', () => ({
    nucleus: N03_NUCLEUS_ID,
    capabilities: N03_AUDIO_CAPABILITIES,
    agents: router.listAgents(),
    residentAgent: N03_RESIDENT_AGENT,
    whisper: describeWhisperAdapter(),
    kokoro: describeKokoroAdapter(),
    contractVersion: '1.1.0',
  }));

  registerWhisper(router);
  registerKokoro(router);
  return router;
}
