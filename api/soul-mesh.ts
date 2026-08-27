import { analyzeEmotion, geminiConfigured, synthesizeSpeech, transcribeAudio } from '../src/mesh/GeminiAudioAdapter';

const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01','N02','N04','N05','N06'] as const;

function response(res:any, m:any, capability:string, payload:unknown, status=200){ return res.status(status).json({ protocol:'soul-mesh/1', id:crypto.randomUUID(), correlationId:m?.correlationId||crypto.randomUUID(), source:NUCLEUS_ID, target:m?.source||NUCLEUS_ID, kind:status>=400?'error':'response', capability, payload, timestamp:Date.now() }); }
function audioInput(payload:any){ if(!payload?.data || !payload?.mimeType) throw new Error('AUDIO_DATA_AND_MIME_TYPE_REQUIRED'); return {data:String(payload.data),mimeType:String(payload.mimeType)}; }

export default async function handler(req:any,res:any){
  if(req.method==='GET') return res.status(200).json({ok:true,nucleus:NUCLEUS_ID,mesh:'soul-mesh/1',version:'1.1.0',geminiConfigured:geminiConfigured(),peers:[...PEERS],inChannels:PEERS.map(p=>`N03.IN.${p}`),outChannels:PEERS.map(p=>`N03.OUT.${p}`),capabilities:['mesh.ping','mesh.describe','audio.transcribe','speech.synthesize','audio.analyze.emotion']});
  if(req.method!=='POST') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const token=process.env.SOUL_MESH_TOKEN;
  if(token && req.headers.authorization!==`Bearer ${token}`) return res.status(401).json({error:'UNAUTHORIZED'});
  const m=req.body;
  if(!m || m.protocol!=='soul-mesh/1' || !m.id || !m.correlationId || !NUCLEI.has(m.source) || m.target!==NUCLEUS_ID || m.source===NUCLEUS_ID || !m.capability) return res.status(400).json({error:'INVALID_SOUL_MESH_MESSAGE'});
  if(m.kind!=='request') return response(res,m,m.capability,{accepted:true});
  try {
    if(m.capability==='mesh.ping') return response(res,m,'mesh.ping',{ok:true,handler:'N03.mesh.ping',echoed:m.payload,processedAt:Date.now()});
    if(m.capability==='mesh.describe') return response(res,m,'mesh.describe',{nucleus:NUCLEUS_ID,peers:[...PEERS],inChannels:PEERS.map(p=>`N03.IN.${p}`),outChannels:PEERS.map(p=>`N03.OUT.${p}`),capabilities:['mesh.ping','mesh.describe','audio.transcribe','speech.synthesize','audio.analyze.emotion'],status:'online'});
    if(m.capability==='audio.transcribe'){const a=audioInput(m.payload);return response(res,m,m.capability,{text:await transcribeAudio(a.data,a.mimeType),provider:'gemini'});}
    if(m.capability==='audio.analyze.emotion'){const a=audioInput(m.payload);return response(res,m,m.capability,{analysis:await analyzeEmotion(a.data,a.mimeType),provider:'gemini'});}
    if(m.capability==='speech.synthesize'){const text=String(m.payload?.text||'');if(!text) throw new Error('TEXT_REQUIRED');const audio=await synthesizeSpeech(text,String(m.payload?.voice||'Kore'));return response(res,m,m.capability,{audio,provider:'gemini'});}
    return response(res,m,m.capability,{code:'CAPABILITY_HANDLER_NOT_REGISTERED',nucleus:NUCLEUS_ID},501);
  } catch(error:any){ return response(res,m,m.capability,{code:error?.message||'N03_CAPABILITY_FAILED',provider:'gemini'},502); }
}
