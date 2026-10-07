import type { N03Peer } from './N03PeerAdapter';
import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';
import {
  analyzeEmotion,
  identifySpeakers,
  summarizeAudio,
  synthesizeSpeech,
  transcribeAudio,
  translateAudio,
} from './GeminiAudioAdapter';

export type N03ArtifactInput = {
  artifact?: unknown;
  kind?: string;
  filename?: string;
  mimeType?: string;
  data?: string;
  operation?: 'identity' | 'normalize-pcm16' | 'mono-pcm16';
  targetMimeType?: string;
  language?: string;
};

export type N03CapabilityRuntimeOptions = {
  peerClient?: Pick<SoulMeshPeerClient, 'request'>;
};

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('N03_CAPABILITY_INPUT_REQUIRED');
  }
  return input as Record<string, unknown>;
}

function audioPayload(input: unknown) {
  const value = record(input);
  const data = typeof value.data === 'string' ? value.data.trim() : '';
  const mimeType = typeof value.mimeType === 'string' ? value.mimeType.trim().toLowerCase() : '';
  if (!data || !mimeType) throw new Error('AUDIO_DATA_AND_MIME_TYPE_REQUIRED');
  return { value, data, mimeType };
}

function decodeBase64(data: string): Buffer {
  const normalized = data.replace(/\s+/g, '');
  if (!normalized || normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('N03_AUDIO_BASE64_INVALID');
  }
  return Buffer.from(normalized, 'base64');
}

function readAscii(buffer: Buffer, offset: number, length: number): string {
  return buffer.subarray(offset, offset + length).toString('ascii');
}

function findChunk(buffer: Buffer, wanted: string): { offset: number; size: number } {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = readAscii(buffer, offset, 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === wanted) return { offset: offset + 8, size };
    offset += 8 + size + (size % 2);
  }
  throw new Error(`N03_WAV_CHUNK_NOT_FOUND:${wanted}`);
}

function transformPcm16Wav(buffer: Buffer, operation: 'normalize-pcm16' | 'mono-pcm16'): Buffer {
  if (buffer.length < 44 || readAscii(buffer, 0, 4) !== 'RIFF' || readAscii(buffer, 8, 4) !== 'WAVE') {
    throw new Error('N03_AUDIO_WAV_REQUIRED');
  }

  const fmt = findChunk(buffer, 'fmt ');
  const data = findChunk(buffer, 'data');
  if (fmt.size < 16) throw new Error('N03_AUDIO_WAV_FMT_INVALID');

  const audioFormat = buffer.readUInt16LE(fmt.offset);
  const channels = buffer.readUInt16LE(fmt.offset + 2);
  const sampleRate = buffer.readUInt32LE(fmt.offset + 4);
  const bitsPerSample = buffer.readUInt16LE(fmt.offset + 14);

  if (audioFormat !== 1 || bitsPerSample !== 16 || channels < 1) {
    throw new Error('N03_AUDIO_PCM16_REQUIRED');
  }

  const frameBytes = channels * 2;
  const frameCount = Math.floor(data.size / frameBytes);
  if (frameCount === 0) throw new Error('N03_AUDIO_EMPTY_PCM_DATA');

  const samples = new Int16Array(frameCount * channels);
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = buffer.readInt16LE(data.offset + i * 2);
  }

  let outputChannels = channels;
  let outputFrames = frameCount;
  let outputSamples: Int16Array;

  if (operation === 'mono-pcm16' && channels > 1) {
    outputChannels = 1;
    outputSamples = new Int16Array(frameCount);
    for (let frame = 0; frame < frameCount; frame += 1) {
      let sum = 0;
      for (let channel = 0; channel < channels; channel += 1) {
        sum += samples[frame * channels + channel];
      }
      outputSamples[frame] = Math.max(-32768, Math.min(32767, Math.round(sum / channels)));
    }
  } else {
    outputSamples = new Int16Array(samples);
  }

  if (operation === 'normalize-pcm16') {
    let peak = 0;
    for (const sample of outputSamples) peak = Math.max(peak, Math.abs(sample));
    if (peak > 0) {
      const gain = 32767 * 0.95 / peak;
      for (let i = 0; i < outputSamples.length; i += 1) {
        outputSamples[i] = Math.max(-32768, Math.min(32767, Math.round(outputSamples[i] * gain)));
      }
    }
  }

  outputFrames = Math.floor(outputSamples.length / outputChannels);
  const originalDataStart = data.offset;
  const dataEnd = data.offset + data.size;
  const prefix = Buffer.from(buffer.subarray(0, originalDataStart - 8));
  const suffix = Buffer.from(buffer.subarray(dataEnd));
  const sampleBytes = Buffer.allocUnsafe(outputSamples.length * 2);
  for (let i = 0; i < outputSamples.length; i += 1) sampleBytes.writeInt16LE(outputSamples[i], i * 2);

  const newDataChunk = Buffer.alloc(8 + sampleBytes.length + (sampleBytes.length % 2));
  newDataChunk.write('data', 0, 4, 'ascii');
  newDataChunk.writeUInt32LE(sampleBytes.length, 4);
  sampleBytes.copy(newDataChunk, 8);

  const fmtChunkEnd = fmt.offset + fmt.size;
  const header = Buffer.from(buffer.subarray(0, fmtChunkEnd));
  const channelOffset = fmt.offset + 2;
  const byteRateOffset = fmt.offset + 8;
  const blockAlignOffset = fmt.offset + 12;
  const blockAlign = outputChannels * 2;

  header.writeUInt16LE(outputChannels, channelOffset);
  header.writeUInt32LE(sampleRate * blockAlign, byteRateOffset);
  header.writeUInt16LE(blockAlign, blockAlignOffset);

  const rebuilt = Buffer.concat([
    header,
    Buffer.from(buffer.subarray(fmtChunkEnd, originalDataStart - 8)),
    newDataChunk,
    suffix,
  ]);
  rebuilt.writeUInt32LE(rebuilt.length - 8, 4);
  return rebuilt;
}

async function executeAudioTransform(input: unknown, client: Pick<SoulMeshPeerClient, 'request'>): Promise<Record<string, unknown>> {
  const value = record(input);
  const artifact = value.artifact;

  if (artifact && typeof artifact === 'object' && !Array.isArray(artifact)) {
    const artifactRecord = artifact as Record<string, unknown>;
    if (String(artifactRecord.kind ?? value.kind ?? '').trim().toLowerCase() === 'document') {
      const correlationId = typeof value.correlationId === 'string' && value.correlationId.trim()
        ? value.correlationId.trim()
        : undefined;
      const response = await client.request(
        'N04',
        'artifact.analyze',
        artifact,
        correlationId,
      );
      return {
        mode: 'delegated-document-artifact',
        nucleus: 'N04',
        capability: 'artifact.analyze',
        correlationId: response.correlationId,
        result: response.payload,
      };
    }
  }

  const { data, mimeType } = audioPayload(value);
  const operation = value.operation === 'normalize-pcm16' || value.operation === 'mono-pcm16'
    ? value.operation
    : 'identity';

  if (operation === 'identity') {
    return {
      transformed: false,
      operation,
      sourceMimeType: mimeType,
      targetMimeType: typeof value.targetMimeType === 'string' && value.targetMimeType.trim()
        ? value.targetMimeType.trim().toLowerCase()
        : mimeType,
      data,
      bytes: decodeBase64(data).byteLength,
    };
  }

  if (mimeType !== 'audio/wav' && mimeType !== 'audio/x-wav') {
    throw new Error('N03_AUDIO_TRANSFORM_PCM16_WAV_ONLY');
  }

  const transformed = transformPcm16Wav(decodeBase64(data), operation);
  return {
    transformed: true,
    operation,
    sourceMimeType: mimeType,
    targetMimeType: 'audio/wav',
    data: transformed.toString('base64'),
    bytes: transformed.byteLength,
  };
}

/**
 * Canonical N03 capability runtime added around existing handlers.
 * Existing N03MeshRuntime registrations remain intact for compatibility.
 */
export class N03CapabilityRuntime {
  private readonly peerClient: Pick<SoulMeshPeerClient, 'request'>;

  constructor(options: N03CapabilityRuntimeOptions = {}) {
    this.peerClient = options.peerClient ?? new SoulMeshPeerClient('N03');
  }

  async execute(capability: string, payload: unknown): Promise<unknown> {
    switch (capability) {
      case 'audio.transcribe': {
        const { value, data, mimeType } = audioPayload(payload);
        const transcript = await transcribeAudio(data, mimeType, {
          model: typeof value.model === 'string' ? value.model : undefined,
          diarization: value.diarization === true,
          wordTimestamp: value.wordTimestamp === true,
          prompt: typeof value.prompt === 'string' ? value.prompt : undefined,
        });
        return { text: transcript, provider: 'gemini', correlationId: value.correlationId ?? null };
      }
      case 'audio.transform':
        return executeAudioTransform(payload, this.peerClient);
      case 'audio.analyze.emotion': {
        const { data, mimeType } = audioPayload(payload);
        return {
          analysis: await analyzeEmotion(data, mimeType),
          provider: 'gemini',
          correlationId: record(payload).correlationId ?? null,
        };
      }
      case 'audio.summarize': {
        const { data, mimeType } = audioPayload(payload);
        return {
          summary: await summarizeAudio(data, mimeType),
          provider: 'gemini',
          correlationId: record(payload).correlationId ?? null,
        };
      }
      case 'speech.translate': {
        const { value, data, mimeType } = audioPayload(payload);
        const translated = await translateAudio(
          data,
          mimeType,
          typeof value.targetLanguage === 'string' ? value.targetLanguage : 'Português do Brasil',
        );
        return {
          ...translated,
          provider: 'gemini',
          correlationId: value.correlationId ?? null,
        };
      }
      case 'speaker.identify': {
        const { value, data, mimeType } = audioPayload(payload);
        return {
          transcript: await identifySpeakers(data, mimeType),
          provider: 'gemini',
          diarization: true,
          correlationId: value.correlationId ?? null,
        };
      }
      case 'speech.synthesize': {
        const value = record(payload);
        const text = typeof value.text === 'string' ? value.text : '';
        const voice = typeof value.voice === 'string' ? value.voice : 'Kore';
        const synthesized = await synthesizeSpeech(text, voice);
        return {
          ...synthesized,
          provider: 'gemini',
          correlationId: value.correlationId ?? null,
        };
      }
      default:
        throw new Error(`N03_CAPABILITY_NOT_EXECUTABLE:${capability}`);
    }
  }
}

export type N03OutboundPeer = N03Peer;
