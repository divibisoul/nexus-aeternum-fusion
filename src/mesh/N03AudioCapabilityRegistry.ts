export type AudioCapabilityStatus='implemented'|'adapter-required';
export type AudioCapability={id:string;status:AudioCapabilityStatus;provider:string;description:string};
export const N03_AUDIO_CAPABILITIES:AudioCapability[]=[
{id:'audio.transcribe',status:'implemented',provider:'Gemini 3.5 Transcribe',description:'Dedicated Gemini speech-to-text with source-language preservation and speaker-turn support.'},
{id:'speech.synthesize',status:'implemented',provider:'Gemini 3.8 Flash TTS',description:'Text-to-audio through the current Gemini TTS endpoint.'},
{id:'audio.analyze.emotion',status:'implemented',provider:'Gemini 3.8 Flash audio understanding',description:'Voice emotion analysis through Gemini audio understanding.'},
{id:'speech.translate',status:'implemented',provider:'Gemini 3.5 Transcribe + Gemini 3.8 Flash',description:'Real transcription followed by target-language translation.'},
{id:'audio.summarize',status:'implemented',provider:'Gemini 3.8 Flash audio understanding',description:'Substantive audio summarization preserving key facts and temporal references.'},
{id:'audio.listen.continuous',status:'adapter-required',provider:'Browser/device audio runtime',description:'Continuous listening requires a device/audio stream adapter and remains explicitly unbound.'},
{id:'audio.denoise',status:'adapter-required',provider:'Audio DSP/runtime',description:'Noise reduction remains an audio DSP capability and is not faked by Gemini.'},
{id:'speaker.identify',status:'implemented',provider:'Gemini 3.5 Transcribe',description:'Speaker-turn diarization only; it does not claim personal identity.'},
];
export function hasAudioCapability(id:string){return N03_AUDIO_CAPABILITIES.some(c=>c.id===id);}
