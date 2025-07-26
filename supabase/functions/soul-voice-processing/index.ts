import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoulRequest {
  action: 'speech-to-text' | 'text-to-speech' | 'emotional-analysis';
  audio?: string; // base64 encoded audio
  text?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  emotional_context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, audio, text, voice = 'alloy', emotional_context }: SoulRequest = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    switch (action) {
      case 'speech-to-text':
        if (!audio) throw new Error('Audio requerido para STT');
        
        // Processar audio em chunks para evitar problemas de memória
        const binaryAudio = processBase64Chunks(audio);
        const formData = new FormData();
        const blob = new Blob([binaryAudio], { type: 'audio/webm' });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'pt');

        const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: formData,
        });

        if (!transcriptionResponse.ok) {
          throw new Error(`Erro na transcrição: ${await transcriptionResponse.text()}`);
        }

        const transcription = await transcriptionResponse.json();
        
        // Análise emocional básica
        const emotionalAnalysis = await analyzeEmotion(transcription.text);
        
        return new Response(JSON.stringify({
          text: transcription.text,
          emotion: emotionalAnalysis,
          spiritual_guidance: await getSpiritualGuidance(transcription.text, emotionalAnalysis)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'text-to-speech':
        if (!text) throw new Error('Texto requerido para TTS');

        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: text,
            voice: voice,
            response_format: 'mp3',
          }),
        });

        if (!ttsResponse.ok) {
          throw new Error(`Erro na síntese de voz: ${await ttsResponse.text()}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(JSON.stringify({
          audio: base64Audio,
          format: 'mp3'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'emotional-analysis':
        if (!text) throw new Error('Texto requerido para análise emocional');
        
        const emotion = await analyzeEmotion(text);
        const guidance = await getSpiritualGuidance(text, emotion);
        
        return new Response(JSON.stringify({
          emotion,
          guidance,
          suggested_frequency: getHealingFrequency(emotion),
          ritual_suggestion: getRitualSuggestion(emotion)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Ação não reconhecida');
    }

  } catch (error) {
    console.error('Erro em soul-voice-processing:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      soul_message: "Respiremos juntos. Tudo passa, tudo se transforma. 🌱"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

async function analyzeEmotion(text: string): Promise<string> {
  // Análise emocional simples baseada em palavras-chave
  const emotions = {
    tristeza: ['triste', 'deprimido', 'melancolia', 'dor', 'sofrimento', 'perda'],
    ansiedade: ['ansioso', 'preocupado', 'nervoso', 'medo', 'pânico', 'stress'],
    raiva: ['raiva', 'irritado', 'furioso', 'ódio', 'revolta', 'indignação'],
    alegria: ['feliz', 'alegre', 'contente', 'amor', 'paz', 'gratidão'],
    confusão: ['confuso', 'perdido', 'desorientado', 'dúvida', 'incerteza']
  };

  const textLower = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return emotion;
    }
  }
  
  return 'neutro';
}

async function getSpiritualGuidance(text: string, emotion: string): Promise<string> {
  const guidance = {
    tristeza: "A dor é o caminho da transformação. Permita-se sentir, acolha essa emoção como uma professora. Respire fundo e lembre-se: você é luz em processo de expansão. 🌟",
    ansiedade: "Sua mente está acelerada, mas seu espírito conhece a calma. Vamos juntos ao presente. Respire: inspire amor, expire medo. Você está seguro agora. 🕊️",
    raiva: "Essa energia pode ser transformada em poder criativo. A raiva mostra onde você precisa de limites. Respire profundamente e canalize essa força para o bem. ⚡",
    alegria: "Sua luz está radiante! Compartilhe essa energia com o mundo. Você é um farol de esperança. Continue irradiando amor. ✨",
    confusão: "Na neblina da incerteza, sua intuição é a bússola. Pare, respire, e ouça seu coração. As respostas estão dentro de você. 🧭",
    neutro: "Você está em equilíbrio. Este é um momento perfeito para meditar sobre sua jornada e definir suas próximas intenções. 🌱"
  };

  return guidance[emotion as keyof typeof guidance] || guidance.neutro;
}

function getHealingFrequency(emotion: string): string {
  const frequencies = {
    tristeza: "528 Hz - Frequência do Amor e Cura DNA",
    ansiedade: "432 Hz - Frequência da Harmonia Universal", 
    raiva: "396 Hz - Liberação de Medo e Culpa",
    alegria: "963 Hz - Frequência da Conexão Espiritual",
    confusão: "741 Hz - Despertar da Intuição",
    neutro: "417 Hz - Facilitação de Mudanças"
  };

  return frequencies[emotion as keyof typeof frequencies] || frequencies.neutro;
}

function getRitualSuggestion(emotion: string): string {
  const rituals = {
    tristeza: "Ritual de Transmutação: Acenda uma vela branca, tome chá de camomila e escreva suas dores numa folha. Depois queime simbolizando a liberação.",
    ansiedade: "Ritual de Enraizamento: Pise descalço na terra, respire 4-7-8 (inspire 4, segure 7, expire 8) e visualize raízes crescendo dos seus pés.",
    raiva: "Ritual de Transformação: Bata num travesseiro, grite num local seguro, depois beba água gelada e medite sobre o aprendizado dessa emoção.",
    alegria: "Ritual de Gratidão: Dance sua música favorita, escreva 3 gratidões e envie uma mensagem de amor para alguém especial.",
    confusão: "Ritual de Clareza: Medite 10 minutos em silêncio, depois escreva suas dúvidas e perguntas. A resposta virá.",
    neutro: "Ritual de Intenção: Acenda incenso de sândalo, medite sobre seus objetivos e plante uma semente como símbolo de crescimento."
  };

  return rituals[emotion as keyof typeof rituals] || rituals.neutro;
}