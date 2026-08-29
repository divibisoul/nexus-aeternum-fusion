import { analyzeEmotion, geminiConfigured, synthesizeSpeech, transcribeAudio } from '../src/mesh/GeminiAudioAdapter';
import { N03_AUDIO_CAPABILITIES } from '../src/mesh/N03AudioCapabilityRegistry';
import { SoulMeshRouter } from '../src/mesh/SoulMeshRouter';
import { startN03PeerRegistration } from '../src/mesh/N03PeerRegistration';
import { validateMessage } from '../src/mesh/SoulMeshProtocol';
import { verifySoulMeshHmac } from '../src/mesh/SoulMeshHmac';

const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01','N02','N04','N05','N06'] as const;
const router = new SoulMeshRouter();
const channels = { inChannels: PEERS.map(p => `N03.IN.${p}`), outChannels: PEERS.map(p => `N03.OUT.${p}`) };
const declaredCapabilities = () => ['mesh.ping','mesh.describe','capability.list',...N03_AUDIO_CAPABILITIES.map(c=>c.id)];

function response(res:any, m:any, capability:string, payload:unknown, status=200){ return res.status(status).json({ protocol:'soul-mesh/1', version:'1.1.0', id:crypto.randomUUID(), correlationId:m?.correlationId||crypto.randomUUID(), source:NUCLEUS_ID, target:m?.source||NUCLEUS_ID, kind:status>=400?'error':'response', capability, payload, timestamp:Date.now() }); }
function audioInput(payload:any){ if(!payload?.data || !payload?.mimeType) throw new Error('AUDIO_DATA_AND_MIME_TYPE_REQUIRED'); return {data:String(payload.data),mimeType:String(payload.mimeType)}; }

router.register('audio.transcribe', async m => { const a=audioInput(m.payload); return {text:await transcribeAudio(a.data,a.mimeType),provider:'gemini'}; });
router.register('audio.analyze.emotion', async m => { const a=audioInput(m.payload); return {analysis:await analyzeEmotion(a.data,a.mimeType),provider:'gemini'}; });
router.register('speech.synthesize', async m => { const text=String((m.payload as any)?.text||''); if(!text) throw new Error('TEXT_REQUIRED'); const audio=await synthesizeSpeech(text,String((m.payload as any)?.voice||'Kore')); return {audio,provider:'gemini'}; });
router.register('mesh.ping', m => ({ok:true,handler:'N03.mesh.ping',echoed:m.payload,processedAt:Date.now()}));
router.register('mesh.describe', () => ({nucleus:NUCLEUS_ID,peers:[...PEERS],...channels,capabilities:declaredCapabilities(),agents:router.listAgents(),status:'online'}));
router.register('capability.list', () => ({nucleus:NUCLEUS_ID,capabilities:N03_AUDIO_CAPABILITIES,agents:router.listAgents()}));

startN03PeerRegistration();

export default async function handler(req:any,res:any){
  if(req.method==='GET') return res.status(200).json({ok:true,nucleus:NUCLEUS_ID,mesh:'soul-mesh/1',version:'1.1.0',geminiConfigured:geminiConfigured(),peers:[...PEERS],...channels,capabilities:declaredCapabilities(),agents:router.listAgents()});
  if(req.method!=='POST') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const m=req.body;
  if(!validateMessage(m) || !NUCLEI.has(m.source) || m.target!==NUCLEUS_ID) return res.status(400).json({error:'INVALID_SOUL_MESH_MESSAGE'});
  const hmacSecret=process.env.SOUL_MESH_HMAC_SECRET;
  if(hmacSecret && !verifySoulMeshHmac(m,hmacSecret)) return res.status(401).json({error:'INVALID_SOUL_MESH_HMAC'});
  if(m.kind!=='request') return response(res,m,m.capability,{accepted:true});
  try { const payload=await router.dispatch(m); return response(res,m,m.capability,payload); }
  catch(error:any){ const code=error?.message||'N03_CAPABILITY_FAILED'; const status=code.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')||code.startsWith('AGENT_NOT_AVAILABLE')?501:502; return response(res,m,m.capability,{code,provider:code.startsWith('GEMINI_')?'gemini':undefined},status); }
}
