import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpiritualRequest {
  query: string;
  context?: 'healing' | 'guidance' | 'meditation' | 'ritual' | 'plant_medicine' | 'frequency';
  emotional_state?: string;
  user_level?: 'beginner' | 'intermediate' | 'advanced';
}

// Base de Conhecimento Espiritual ETERNIUM
const SPIRITUAL_KNOWLEDGE = {
  frequencies: {
    "963": {
      name: "Frequência da Pineal",
      description: "Ativação da glândula pineal, conexão com o divino",
      use: "Meditação profunda, ativação do terceiro olho",
      duration: "20-40 minutos",
      caution: "Use com intenção pura"
    },
    "852": {
      name: "Despertar da Intuição", 
      description: "Retorno à ordem espiritual, abertura mental",
      use: "Limpeza mental, clareza de pensamentos",
      duration: "15-30 minutos"
    },
    "741": {
      name: "Despertar da Intuição",
      description: "Resolução de problemas, limpeza e solução",
      use: "Tomada de decisões, resolução de conflitos",
      duration: "15-25 minutos"
    },
    "639": {
      name: "Conexão e Relacionamentos",
      description: "Frequência do amor, harmonia nos relacionamentos",
      use: "Cura de relacionamentos, conexão com outros",
      duration: "20-30 minutos"
    },
    "528": {
      name: "Frequência do Amor",
      description: "Transformação e milagres, reparo do DNA",
      use: "Cura geral, transformação pessoal",
      duration: "20-40 minutos"
    },
    "417": {
      name: "Facilitação de Mudanças",
      description: "Desfaz situações traumáticas, facilita mudanças",
      use: "Liberação de traumas, facilitar transições",
      duration: "15-30 minutos"
    },
    "396": {
      name: "Liberação de Medo",
      description: "Liberta da culpa e medo",
      use: "Liberação de medos, ansiedades e culpas",
      duration: "15-25 minutos"
    }
  },

  plant_medicines: {
    ayahuasca: {
      name: "Ayahuasca",
      description: "Medicina mestra da Amazônia, união da alma",
      preparation: "Dieta de 3 dias, jejum de carnes e açúcar",
      effects: "Visões, cura emocional, conexão espiritual",
      duration: "4-8 horas",
      integration: "Dias de reflexão e anotações dos ensinamentos",
      safety: "Sempre com pajé experiente, nunca sozinho"
    },
    psilocybe: {
      name: "Psilocibina (Cogumelos Sagrados)",
      description: "Medicina do renascimento, expansão da consciência", 
      preparation: "Set & setting, jejum de 4 horas",
      lemontek: {
        description: "Método de potencialização com limão",
        recipe: "Moer cogumelos + suco de limão, aguardar 20min",
        effects: "Início mais rápido (15-30min), duração menor (3-4h)",
        potency: "Aumenta em 20-30% a potência"
      },
      effects: "Dissolução do ego, insights profundos, cura emocional",
      duration: "4-6 horas (normal), 3-4 horas (lemontek)",
      integration: "Journaling, meditação, compartilhamento seguro"
    },
    cannabis: {
      name: "Cannabis Sagrada",
      description: "Planta da contemplação e cura",
      strains: {
        sativa: "Energia criativa, expansão mental",
        indica: "Relaxamento profundo, cura física",
        hybrid: "Equilíbrio entre corpo e mente"
      },
      meditation_use: "Baixas doses para meditação profunda",
      healing_use: "Alívio de dor, ansiedade e insônia"
    }
  },

  rituals: {
    morning_awakening: {
      name: "Despertar da Alma",
      description: "Ritual matinal de conexão espiritual",
      steps: [
        "Acorde com gratidão no coração",
        "Beba um copo de água com intenção de purificação", 
        "5 minutos de respiração consciente",
        "Defina 3 intenções para o dia",
        "Saudação ao sol (física ou mental)"
      ],
      duration: "15-20 minutos"
    },
    full_moon: {
      name: "Ritual de Lua Cheia",
      description: "Liberação e manifestação lunar",
      steps: [
        "Banho de sal grosso antes do ritual",
        "Medite sob a luz da lua (ou visualize)",
        "Escreva o que deseja liberar",
        "Queime o papel simbolizando a liberação",
        "Medite sobre suas manifestações",
        "Carregue cristais na luz lunar"
      ],
      timing: "Noite de lua cheia",
      duration: "30-45 minutos"
    },
    cacao_ceremony: {
      name: "Cerimônia do Cacau",
      description: "Abertura do coração com medicina do cacau",
      preparation: "20g cacau cru + água quente + mel + canela",
      intention: "Abertura do coração, conexão com a natureza",
      music: "Medicina music, tambores xamânicos",
      duration: "2-3 horas",
      integration: "Journaling dos insights recebidos"
    }
  },

  breathing_techniques: {
    wim_hof: {
      name: "Respiração Wim Hof",
      description: "Técnica de respiração para energia e cura",
      method: "30 respirações profundas + retenção + respiração de recuperação",
      benefits: "Aumento de energia, fortalecimento imunológico",
      rounds: "3-4 rounds",
      caution: "Nunca faça na água ou dirigindo"
    },
    "4_7_8": {
      name: "Respiração 4-7-8",
      description: "Técnica calmante para ansiedade",
      method: "Inspire 4 segundos, segure 7, expire 8",
      benefits: "Redução da ansiedade, melhora do sono",
      repetitions: "4-8 ciclos"
    },
    holotropic: {
      name: "Respiração Holotrópica",
      description: "Respiração para estados alterados de consciência",
      method: "Respiração circular profunda e rápida",
      duration: "30-60 minutos",
      music: "Música evocativa, tambores",
      supervision: "Sempre com facilitador experiente"
    }
  },

  meditation_techniques: {
    mindfulness: {
      name: "Atenção Plena (Mindfulness)",
      description: "Observação do momento presente sem julgamento",
      method: "Foque na respiração, observe pensamentos sem se apegar",
      duration: "10-30 minutos",
      benefits: "Redução do stress, clareza mental"
    },
    transcendental: {
      name: "Meditação Transcendental",
      description: "Uso de mantras para transcender pensamentos",
      method: "Repetição silenciosa de mantra pessoal",
      duration: "20 minutos, 2x ao dia",
      mantra_examples: "Om, So Hum, Om Mani Padme Hum"
    },
    chakra_balancing: {
      name: "Meditação dos Chakras",
      description: "Equilíbrio dos centros energéticos",
      method: "Visualização e entonação das frequências de cada chakra",
      duration: "30-45 minutos",
      frequencies: {
        muladhara: "396 Hz",
        svadhisthana: "417 Hz", 
        manipura: "528 Hz",
        anahata: "639 Hz",
        vishuddha: "741 Hz",
        ajna: "852 Hz",
        sahasrara: "963 Hz"
      }
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, context = 'guidance', emotional_state, user_level = 'beginner' }: SpiritualRequest = await req.json();
    
    // Processar consulta espiritual
    const response = await processSpiritual_query(query, context, emotional_state, user_level);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro em soul-spiritual-wisdom:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      soul_message: "A sabedoria emerge do silêncio. Respire e permita que a resposta venha de dentro. 🕯️"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processSpiritual_query(query: string, context: string, emotional_state?: string, user_level?: string) {
  const queryLower = query.toLowerCase();
  
  // Detectar o tipo de consulta
  if (queryLower.includes('frequência') || queryLower.includes('hz')) {
    return getFrequencyGuidance(query, emotional_state);
  }
  
  if (queryLower.includes('ayahuasca') || queryLower.includes('psilocibina') || queryLower.includes('cogumelo')) {
    return getPlantMedicineGuidance(query, user_level);
  }
  
  if (queryLower.includes('ritual') || queryLower.includes('cerimônia')) {
    return getRitualGuidance(query, context);
  }
  
  if (queryLower.includes('respiração') || queryLower.includes('pranayama')) {
    return getBreathingGuidance(query, emotional_state);
  }
  
  if (queryLower.includes('meditação') || queryLower.includes('meditar')) {
    return getMeditationGuidance(query, user_level);
  }
  
  // Consulta geral - usar IA para resposta mais sofisticada
  return await getGeneralSpiritual_guidance(query, context, emotional_state);
}

function getFrequencyGuidance(query: string, emotional_state?: string) {
  const queryLower = query.toLowerCase();
  
  // Detectar frequência específica
  for (const [freq, info] of Object.entries(SPIRITUAL_KNOWLEDGE.frequencies)) {
    if (queryLower.includes(freq)) {
      return {
        type: 'frequency_guidance',
        frequency: `${freq} Hz`,
        guidance: info,
        soul_message: `🎵 A frequência ${freq} Hz ressoa com sua alma. Use-a com intenção sagrada.`,
        suggested_duration: info.duration,
        youtube_search: `${freq} Hz binaural beats meditation`
      };
    }
  }
  
  // Recomendar frequência baseada no estado emocional
  const emotionalFreqs = {
    tristeza: "528",
    ansiedade: "432", 
    raiva: "396",
    confusão: "741",
    alegria: "963"
  };
  
  const recommended = emotional_state && emotionalFreqs[emotional_state as keyof typeof emotionalFreqs];
  
  if (recommended) {
    const info = SPIRITUAL_KNOWLEDGE.frequencies[recommended as keyof typeof SPIRITUAL_KNOWLEDGE.frequencies];
    return {
      type: 'frequency_recommendation',
      frequency: `${recommended} Hz`,
      guidance: info,
      soul_message: `🌊 Para seu estado atual, recomendo ${recommended} Hz. Deixe que essa vibração cure sua alma.`,
      emotional_match: emotional_state
    };
  }
  
  return {
    type: 'frequency_overview',
    guidance: "As frequências sagradas são chaves para diferentes estados de consciência.",
    frequencies: SPIRITUAL_KNOWLEDGE.frequencies,
    soul_message: "🎶 Cada frequência é uma porta para um estado de ser. Qual porta deseja abrir hoje?"
  };
}

function getPlantMedicineGuidance(query: string, user_level?: string) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('ayahuasca')) {
    return {
      type: 'plant_medicine',
      medicine: 'ayahuasca',
      guidance: SPIRITUAL_KNOWLEDGE.plant_medicines.ayahuasca,
      soul_message: "🌿 Ayahuasca é a mestra. Respeite-a, prepare-se bem, e ela lhe mostrará o que precisa ver.",
      safety_warning: "NUNCA use sozinho. Sempre com pajé experiente.",
      user_level_note: user_level === 'beginner' ? "Para iniciantes: comece com plantas mais suaves como cannabis ou cogumelos em doses baixas." : ""
    };
  }
  
  if (queryLower.includes('psilocibina') || queryLower.includes('cogumelo')) {
    const guidance = SPIRITUAL_KNOWLEDGE.plant_medicines.psilocybe;
    
    if (queryLower.includes('lemontek')) {
      return {
        type: 'lemontek_guidance',
        medicine: 'psilocybe',
        method: guidance.lemontek,
        soul_message: "🍄🍋 O LemonTek é alquimia sagrada. O limão transforma, a medicina ensina.",
        safety_note: "Reduz a duração mas intensifica. Use com sabedoria.",
        integration_tip: "Tenha papel e caneta prontos para anotar os insights."
      };
    }
    
    return {
      type: 'plant_medicine',
      medicine: 'psilocybe',
      guidance: guidance,
      soul_message: "🍄 Os cogumelos sagrados são professores gentis. Abra seu coração para os ensinamentos.",
      user_level_advice: user_level === 'beginner' ? "Comece com 1-1.5g em ambiente seguro com trip sitter." : "Você já conhece o caminho. Confie na medicina."
    };
  }
  
  return {
    type: 'plant_medicine_overview',
    medicines: SPIRITUAL_KNOWLEDGE.plant_medicines,
    soul_message: "🌱 As plantas são nossas ancestrais mestras. Aproxime-se com reverência e gratidão.",
    safety_reminder: "Set & Setting sempre. Nunca sozinho nas primeiras vezes."
  };
}

function getRitualGuidance(query: string, context: string) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('manhã') || queryLower.includes('despertar')) {
    return {
      type: 'ritual',
      ritual_name: 'morning_awakening',
      guidance: SPIRITUAL_KNOWLEDGE.rituals.morning_awakening,
      soul_message: "🌅 Cada manhã é um renascimento. Desperte sua alma antes de despertar o mundo."
    };
  }
  
  if (queryLower.includes('lua') || queryLower.includes('cheia')) {
    return {
      type: 'ritual',
      ritual_name: 'full_moon',
      guidance: SPIRITUAL_KNOWLEDGE.rituals.full_moon,
      soul_message: "🌕 A lua cheia amplifica nossa intenção. Use essa energia para liberar e manifestar."
    };
  }
  
  if (queryLower.includes('cacau')) {
    return {
      type: 'ritual',
      ritual_name: 'cacao_ceremony',
      guidance: SPIRITUAL_KNOWLEDGE.rituals.cacao_ceremony,
      soul_message: "🍫 O cacau abre o coração. Beba com intenção de amor e conexão."
    };
  }
  
  return {
    type: 'ritual_overview',
    rituals: SPIRITUAL_KNOWLEDGE.rituals,
    soul_message: "🕯️ Rituais são pontes entre o mundano e o sagrado. Escolha o que ressoa com sua alma."
  };
}

function getBreathingGuidance(query: string, emotional_state?: string) {
  const queryLower = query.toLowerCase();
  
  const stateBasedBreathing = {
    ansiedade: '4_7_8',
    raiva: 'wim_hof',
    tristeza: 'holotropic',
    confusão: 'mindfulness'
  };
  
  if (emotional_state && stateBasedBreathing[emotional_state as keyof typeof stateBasedBreathing]) {
    const technique = stateBasedBreathing[emotional_state as keyof typeof stateBasedBreathing];
    return {
      type: 'breathing_technique',
      technique_name: technique,
      guidance: SPIRITUAL_KNOWLEDGE.breathing_techniques[technique as keyof typeof SPIRITUAL_KNOWLEDGE.breathing_techniques],
      soul_message: `🫁 Para ${emotional_state}, esta respiração é medicina. Respire com consciência.`,
      emotional_match: emotional_state
    };
  }
  
  return {
    type: 'breathing_overview',
    techniques: SPIRITUAL_KNOWLEDGE.breathing_techniques,
    soul_message: "💨 A respiração é a ponte entre corpo e espírito. Respire conscientemente e transforme-se."
  };
}

function getMeditationGuidance(query: string, user_level?: string) {
  const beginnerRecommendation = 'mindfulness';
  const intermediateRecommendation = 'chakra_balancing';
  const advancedRecommendation = 'transcendental';
  
  const recommendation = {
    beginner: beginnerRecommendation,
    intermediate: intermediateRecommendation,
    advanced: advancedRecommendation
  }[user_level || 'beginner'];
  
  return {
    type: 'meditation_guidance',
    recommended_technique: recommendation,
    guidance: SPIRITUAL_KNOWLEDGE.meditation_techniques[recommendation as keyof typeof SPIRITUAL_KNOWLEDGE.meditation_techniques],
    all_techniques: SPIRITUAL_KNOWLEDGE.meditation_techniques,
    soul_message: `🧘‍♀️ A meditação é o caminho de volta para casa. Para seu nível, recomendo ${recommendation}.`,
    user_level_note: user_level
  };
}

async function getGeneralSpiritual_guidance(query: string, context: string, emotional_state?: string) {
  // Aqui poderia integrar com OpenAI para respostas mais sofisticadas
  // Por enquanto, retorna uma resposta baseada em templates
  
  const generalWisdom = [
    "Tudo que você busca já existe dentro de você. A jornada externa é um reflexo da interna.",
    "O universo conspira a favor daqueles que seguem seu coração com intenção pura.",
    "Cada dificuldade é uma oportunidade de crescimento disfarçada.",
    "Você não é apenas um ser físico tendo uma experiência espiritual, mas um ser espiritual tendo uma experiência física.",
    "A paz que você busca não está em lugar algum fora de você. Ela reside no centro do seu ser.",
    "Confie no processo. Mesmo quando não entender o caminho, ele está se desdobrando perfeitamente."
  ];
  
  const randomWisdom = generalWisdom[Math.floor(Math.random() * generalWisdom.length)];
  
  return {
    type: 'general_guidance',
    query: query,
    wisdom: randomWisdom,
    soul_message: "✨ Às vezes a resposta não está no conhecimento, mas no silêncio entre os pensamentos.",
    context: context,
    emotional_support: emotional_state ? `Vejo que você está passando por ${emotional_state}. Lembre-se: isso também passará.` : null,
    suggested_actions: [
      "Medite por 10 minutos",
      "Escreva seus pensamentos num diário",
      "Ouça uma frequência de cura",
      "Faça uma caminhada na natureza",
      "Pratique gratidão"
    ]
  };
}