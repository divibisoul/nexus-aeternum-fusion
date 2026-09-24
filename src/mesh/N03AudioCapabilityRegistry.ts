export type AudioCapabilityStatus='implemented'|'adapter-required';
export type AudioCapability={
  id:string;
  status:AudioCapabilityStatus;
  provider:string;
  description:string;
};
export const N03_AUDIO_CAPABILITIES:AudioCapability[]=[
  {id:'audio.transcribe',status:'implemented',provider:'Gemini API / Google AI Studio',description:'Audio-to-text through the Gemini multimodal API.'},
  {id:'speech.synthesize',status:'implemented',provider:'Gemini 2.5 Flash TTS',description:'Text-to-audio through the Gemini TTS API.'},
  {id:'audio.analyze.emotion',status:'implemented',provider:'Gemini audio understanding',description:'Voice emotion analysis through Gemini audio understanding.'},
  {id:'speech.translate',status:'adapter-required',provider:'Gemini + translation pipeline',description:'Transcribe, translate and synthesize pipeline contract.'},
  {id:'audio.summarize',status:'adapter-required',provider:'Gemini audio understanding',description:'Long-audio summarization contract; handler still needs to be exposed.'},
  {id:'audio.listen.continuous',status:'adapter-required',provider:'Browser/device audio runtime',description:'Keyword listening contract.'},
  {id:'audio.denoise',status:'adapter-required',provider:'Audio DSP/runtime',description:'Noise reduction contract.'},
  {id:'speaker.identify',status:'adapter-required',provider:'Gemini diarization / speaker runtime',description:'Speaker identification contract; explicit handler still needs to be exposed.'},
];

export function hasAudioCapability(id:string){
  return N03_AUDIO_CAPABILITIES.some(c=>c.id===id);
}

export function executableAudioCapabilities(){
  return N03_AUDIO_CAPABILITIES.filter(c=>c.status==='implemented');
}