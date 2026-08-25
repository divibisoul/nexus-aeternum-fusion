import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoulRequest {
  action: 'speech-to-text' | 'text-to-speech' | 'emotional-analysis';
  audio?: string;
  text?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  emotional_context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Autenticação obrigatória' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, audio, text, voice = 'alloy' }: SoulRequest = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key não configurada');

    switch (action) {
      case 'speech-to-text': {
        if (!audio) throw new Error('Audio requerido para STT');
        const binaryAudio = processBase64Chunks(audio);
        const formData = new FormData();
        formData.append('file', new Blob([binaryAudio], { type: 'audio/webm' }), 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'pt');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          body: formData,
        });
        if (!response.ok) throw new Error(`Erro na transcrição: ${await response.text()}`);

        const transcription = await response.json();
        const emotion = await analyzeEmotion(transcription.text);
        return jsonResponse({
          text: transcription.text,
          emotion,
          spiritual_guidance: await getSpiritualGuidance(transcription.text, emotion),
        });
      }

      case 'text-to-speech': {
        if (!text) throw new Error('Texto requerido para TTS');
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'tts-1-hd', input: text, voice, response_format: 'mp3' }),
        });
        if (!response.ok) throw new Error(`Erro na síntese de voz: ${await response.text()}`);

        const audioBuffer = await response.arrayBuffer();
        return jsonResponse({ audio: uint8ArrayToBase64(new Uint8Array(audioBuffer)), format: 'mp3' });
      }

      case 'emotional-analysis': {
        if (!text) throw new Error('Texto requerido para análise emocional');
        const emotion = await analyzeEmotion(text);
        return jsonResponse({
          emotion,
          guidance: await getSpiritualGuidance(text, emotion),
          suggested_frequency: getHealingFrequency(emotion),
          ritual_suggestion: getRitualSuggestion(emotion),
        });
      }

      default: throw new Error('Ação não reconhecida');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro em soul-voice-processing:', error);
    return jsonResponse({ error: message, soul_message: 'Respiremos juntos. Tudo passa, tudo se transforma. 🌱' }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  for (let position = 0; position < base64String.length; position += chunkSize) {
    const binaryChunk = atob(base64String.slice(position, position + chunkSize));
    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) bytes[i] = binaryChunk.charCodeAt(i);
    chunks.push(bytes);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function uint8ArrayToBase64(bytes: Uint8Array, chunkSize = 0x8000): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

async function analyzeEmotion(text: string): Promise<string> {
  const emotions = {
    tristeza: ['triste', 'deprimido', 'melancolia', 'dor', 'sofrimento', 'perda'],
    ansiedade: ['ansioso', 'preocupado', 'nervoso', 'medo', 'pânico', 'stress'],
    raiva: ['raiva', 'irritado', 'furioso', 'ódio', 'revolta', 'indignação'],
    alegria: ['feliz', 'alegre', 'contente', 'amor', 'paz', 'gratidão'],
    confusão: ['confuso', 'perdido', 'desorientado', 'dúvida', 'incerteza'],
  };
  const lower = text.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => lower.includes(keyword))) return emotion;
  }
  return 'neutro';
}

async function getSpiritualGuidance(_text: string, emotion: string): Promise<string> {
  const guidance = {
    tristeza: 'A dor é o caminho da transformação. Permita-se sentir, acolha essa emoção como uma professora. Respire fundo e lembre-se: você é luz em processo de expansão. 🌟',
    ansiedade: 'Sua mente está acelerada, mas seu espírito conhece a calma. Vamos juntos ao presente. Respire: inspire amor, expire medo. Você está seguro agora. 🕊️',
    raiva: 'Essa energia pode ser transformada em poder criativo. A raiva mostra onde você precisa de limites. Respire profundamente e canalize essa força para o bem. ⚡',
    alegria: 'Sua luz está radiante! Compartilhe essa energia com o mundo. Você é um farol de esperança. Continue irradiando amor. ✨',
    confusão: 'Na neblina da incerteza, sua intuição é a bússola. Pare, respire, e ouça seu coração. As respostas estão dentro de você. 🧭',
    neutro: 'Você está em equilíbrio. Este é um momento perfeito para meditar sobre sua jornada e definir suas próximas intenções. 🌱',
  };
  return guidance[emotion as keyof typeof guidance] || guidance.neutro;
}

function getHealingFrequency(emotion: string): string {
  const frequencies = {
    tristeza: '528 Hz - Frequência do Amor e Cura DNA',
    ansiedade: '432 Hz - Frequência da Harmonia Universal',
    raiva: '396 Hz - Liberação de Medo e Culpa',
    alegria: '963 Hz - Frequência da Conexão Espiritual',
    confusão: '741 Hz - Despertar da Intuição',
    neutro: '417 Hz - Facilitação de Mudanças',
  };
  return frequencies[emotion as keyof typeof frequencies] || frequencies.neutro;
}

function getRitualSuggestion(emotion: string): string {
  const rituals = {
    tristeza: 'Ritual de Transmutação: Acenda uma vela branca, tome chá de camomila e escreva suas dores numa folha. Depois queime simbolizando a liberação.',
    ansiedade: 'Ritual de Enraizamento: Pise descalço na terra, respire 4-7-8 (inspire 4, segure 7, expire 8) e visualize raízes crescendo dos seus pés.',
    raiva: 'Ritual de Transformação: Bata num travesseiro, grite num local seguro, depois beba água gelada e medite sobre o aprendizado dessa emoção.',
    alegria: 'Ritual de Gratidão: Dance sua música favorita, escreva 3 gratidões e envie uma mensagem de amor para alguém especial.',
    confusão: 'Ritual de Clareza: Medite 10 minutos em silêncio, depois escreva suas dúvidas e perguntas. A resposta virá.',
    neutro: 'Ritual de Intenção: Acenda incenso de sândalo, medite sobre seus objetivos e plante uma semente como símbolo de crescimento.',
  };
  return rituals[emotion as keyof typeof rituals] || rituals.neutro;
}
