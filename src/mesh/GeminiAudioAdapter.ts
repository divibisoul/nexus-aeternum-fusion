const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }> };
  }>;
};

function key(): string {
  const value = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!value) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  return value;
}

function envModel(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function responseText(data: GeminiResponse, emptyCode: string): string {
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || '';
  if (!text) throw new Error(emptyCode);
  return text;
}

function jitter(maxExclusive: number): number {
  if (maxExclusive <= 1 || !globalThis.crypto?.getRandomValues) return 0;
  const bytes = new Uint32Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return bytes[0] % maxExclusive;
}

async function generate(model: string, body: unknown, attempts = 3): Promise<GeminiResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': key(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({})) as GeminiResponse;
      if (response.ok) return data;

      const status = response.status;
      const message = `GEMINI_${status}`;
      if (!(status === 408 || status === 409 || status === 429 || status >= 500) || attempt === attempts - 1) {
        throw new Error(`${message}:${JSON.stringify(data)}`);
      }

      await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt + jitter(100)));
    } catch (error) {
      lastError = error;
      if (!(error instanceof Error) || attempt === attempts - 1) throw error;
      if (!/(timeout|network|fetch failed|socket|GEMINI_(408|409|429|5\d\d))/i.test(error.message)) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export type GeminiTranscriptionOptions = {
  model?: string;
  prompt?: string;
};

export async function transcribeAudio(
  base64: string,
  mimeType: string,
  options: GeminiTranscriptionOptions = {},
): Promise<string> {
  if (!base64.trim() || !mimeType.trim()) throw new Error('GEMINI_AUDIO_INPUT_REQUIRED');

  const data = await generate(
    options.model || envModel('GEMINI_TRANSCRIBE_MODEL', 'gemini-3.5-transcribe'),
    {
      contents: [{
        parts: [
          {
            text: options.prompt
              || 'Transcribe this audio faithfully. Preserve the source language and speaker turns when possible. Return only the transcript.',
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
    },
  );

  return responseText(data, 'GEMINI_TRANSCRIPTION_EMPTY_RESPONSE');
}

export async function analyzeEmotion(base64: string, mimeType: string): Promise<string> {
  if (!base64.trim() || !mimeType.trim()) throw new Error('GEMINI_AUDIO_INPUT_REQUIRED');

  const data = await generate(
    envModel('GEMINI_AUDIO_MODEL', 'gemini-3.8-flash'),
    {
      contents: [{
        parts: [
          {
            text: 'Analyze the emotional characteristics of this voice recording. Return concise JSON with primaryEmotion, secondaryEmotions, confidence (0-1), and evidence.',
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    },
  );

  return responseText(data, 'GEMINI_EMOTION_ANALYSIS_EMPTY_RESPONSE');
}

export async function summarizeAudio(base64: string, mimeType: string): Promise<string> {
  if (!base64.trim() || !mimeType.trim()) throw new Error('GEMINI_AUDIO_INPUT_REQUIRED');

  const data = await generate(
    envModel('GEMINI_AUDIO_MODEL', 'gemini-3.8-flash'),
    {
      contents: [{
        parts: [
          { text: 'Summarize the substantive content of this audio. Preserve key facts, decisions, topics and important temporal references.' },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
    },
  );

  return responseText(data, 'GEMINI_AUDIO_SUMMARY_EMPTY_RESPONSE');
}

export async function translateAudio(
  base64: string,
  mimeType: string,
  targetLanguage = 'Português do Brasil',
): Promise<{ transcript: string; translation: string }> {
  const transcript = await transcribeAudio(base64, mimeType);
  if (!targetLanguage.trim()) throw new Error('GEMINI_TARGET_LANGUAGE_REQUIRED');

  const data = await generate(
    envModel('GEMINI_MODEL', 'gemini-3.8-flash'),
    {
      contents: [{
        parts: [{
          text: `Translate the following transcript to ${targetLanguage}. Preserve meaning, speaker turns and terminology. Return only the translation.\n\n${transcript}`,
        }],
      }],
    },
  );

  return {
    transcript,
    translation: responseText(data, 'GEMINI_AUDIO_TRANSLATION_EMPTY_RESPONSE'),
  };
}

export async function identifySpeakers(base64: string, mimeType: string): Promise<string> {
  return transcribeAudio(base64, mimeType, {
    prompt: 'Transcribe this audio with explicit speaker-turn labels (for example SPEAKER_1, SPEAKER_2) whenever the audio permits. Do not claim personal identities. Return only the diarized transcript.',
  });
}

export async function synthesizeSpeech(text: string, voice = 'Kore'): Promise<{ mimeType: string; data: string }> {
  if (!text.trim()) throw new Error('GEMINI_TTS_TEXT_REQUIRED');

  const data = await generate(
    envModel('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts'),
    {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice.trim() || 'Kore' },
          },
        },
      },
    },
  );

  const part = data.candidates?.[0]?.content?.parts?.find(candidate => Boolean(candidate.inlineData?.data));
  if (!part?.inlineData?.data) throw new Error('GEMINI_TTS_AUDIO_NOT_RETURNED');

  return {
    mimeType: part.inlineData.mimeType || 'audio/wav',
    data: part.inlineData.data,
  };
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}
