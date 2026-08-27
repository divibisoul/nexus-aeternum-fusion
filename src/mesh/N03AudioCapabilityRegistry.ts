export type AudioCapabilityStatus='implemented'|'adapter-required';
export type AudioCapability={id:string;status:AudioCapabilityStatus;provider:string;description:string};
export const N03_AUDIO_CAPABILITIES:AudioCapability[]=[
{id:'audio.transcribe',status:'implemented',provider:'@google-cloud/speech / @huggingface/transformers',description:'Transcribe audio when provider credentials/runtime are available.'},
{id:'speech.synthesize',status:'implemented',provider:'@google-cloud/text-to-speech',description:'Synthesize speech from text when provider credentials/runtime are available.'},
{id:'audio.analyze.emotion',status:'adapter-required',provider:'@huggingface/transformers',description:'Emotion analysis adapter is declared; model selection/runtime integration remains required.'},
{id:'speech.translate',status:'adapter-required',provider:'Speech + translation runtime',description:'Transcribe, translate and synthesize pipeline contract.'},
{id:'audio.summarize',status:'adapter-required',provider:'AI runtime',description:'Long-audio summarization contract.'},
{id:'audio.listen.continuous',status:'adapter-required',provider:'Browser/device audio runtime',description:'Keyword listening contract.'},
{id:'audio.denoise',status:'adapter-required',provider:'Audio DSP/runtime',description:'Noise reduction contract.'},
{id:'speaker.identify',status:'adapter-required',provider:'Speaker recognition runtime',description:'Speaker identification contract.'},
];
export function hasAudioCapability(id:string){return N03_AUDIO_CAPABILITIES.some(c=>c.id===id);}
