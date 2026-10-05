import { geminiConfigured } from '../src/mesh/GeminiAudioAdapter';
import { createN03MeshRouter, declaredN03Capabilities } from '../src/mesh/N03MeshRuntime';
import { startN03PeerRegistration } from '../src/mesh/N03PeerRegistration';
import { MESH_PEERS, SOUL_MESH_CONTRACT_VERSION, validateMessage } from '../src/mesh/SoulMeshProtocol';
import { signSoulMeshLegacyResponse, verifySoulMeshHmac } from '../src/mesh/SoulMeshHmac';
import { describeWhisperAdapter } from '../src/mesh/WhisperAdapter';
import { describeKokoroAdapter } from '../src/mesh/KokoroAdapter';
import { N03_RESIDENT_AGENT } from '../src/mesh/N03ResidentAgent';

const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07']);
const PEERS = MESH_PEERS;
const MAX_CLOCK_SKEW_MS = 30_000;
const REPLAY_WINDOW_MS = 5 * 60_000;
const SARA_URL = String(process.env.SARA_SERVICE_URL || '').trim().replace(/\/$/, '');
const SARA_TOKEN = String(process.env.SARA_SERVICE_TOKEN || '').trim();
const seenRequests = new Map<string, number>();
const router = createN03MeshRouter();
const channels = { inChannels: PEERS.map(p => `N03.IN.${p}`), outChannels: PEERS.map(p => `N03.OUT.${p}`) };
const declaredCapabilities = declaredN03Capabilities;

function response(res:any, m:any, capability:string, payload:unknown, status=200){
  const base:any={
    protocol:'soul-mesh/1',
    contractVersion:SOUL_MESH_CONTRACT_VERSION,
    id:crypto.randomUUID(),
    correlationId:m?.correlationId||crypto.randomUUID(),
    source:NUCLEUS_ID,
    target:m?.source||NUCLEUS_ID,
    kind:status>=400?'error':'response',
    capability,
    payload,
    timestamp:Date.now(),
  };
  const secret=process.env.SOUL_MESH_HMAC_SECRET?.trim();
  if(secret && m){
    const signed=signSoulMeshLegacyResponse(m, payload, base.kind, secret);
    return res.status(status).json({...signed, meta:{...signed.meta, nonce:signed.nonce}});
  }
  return res.status(status).json(base);
}
function acceptOnce(id:string):boolean{const now=Date.now();for(const [key,t] of seenRequests)if(now-t>REPLAY_WINDOW_MS)seenRequests.delete(key);if(seenRequests.has(id))return false;seenRequests.set(id,now);return true;}
async function callSara(capability:string,payload:unknown,correlationId:string):Promise<unknown>{
  if(!SARA_URL||(capability!=='sara.health'&&!SARA_TOKEN))throw new Error('SARA_SERVICE_NOT_CONFIGURED');
  const routes:Record<string,string>={'sara.health':'/health','sara.cycle':'/v1/cycle','sara.audit':'/v1/audit','sara.regenerate':'/v1/regenerate','sara.state':'/v1/state','sara.capabilities':'/v1/capabilities','sara.trace': typeof (payload as {cycle_id?:unknown})?.cycle_id==='string' ? '/v1/trace/'+encodeURIComponent((payload as {cycle_id:string}).cycle_id) : ''};
  const route=routes[capability];if(!route)throw new Error('SARA_CAPABILITY_NOT_SUPPORTED');
  const isGet=capability==='sara.health'||capability==='sara.state'||capability==='sara.capabilities'||capability==='sara.trace';
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Number(process.env.SARA_REQUEST_TIMEOUT_MS||30000));
  try{
    const response=await fetch(SARA_URL+route,{method:isGet?'GET':'POST',headers:{accept:'application/json','content-type':'application/json',...(capability==='sara.health'?{}:{authorization:'Bearer '+SARA_TOKEN}),'x-correlation-id':correlationId},...(isGet?{}:{body:JSON.stringify({...((payload&&typeof payload==='object')?payload:{input:String(payload??'')}),...(capability==='sara.cycle'&&(!payload||typeof payload!=='object'||!('cycle_id' in payload))?{cycle_id:correlationId}:{})})}),signal:controller.signal,cache:'no-store'});
    const body=await response.json().catch(()=>null);if(!response.ok)throw new Error('SARA_HTTP_'+response.status);return body;
  }finally{clearTimeout(timer);}
}

function meshAuthorized(req:any, message:any):boolean{
  const secret=process.env.SOUL_MESH_HMAC_SECRET?.trim();
  if(secret && verifySoulMeshHmac(message,secret)) return true;
  const token=process.env.SOUL_MESH_TOKEN?.trim();
  const authorization=typeof req.headers?.authorization==='string' ? req.headers.authorization.trim() : '';
  if(token && /^Bearer\\s+/i.test(authorization)){
    const provided=authorization.replace(/^Bearer\\s+/i,'').trim();
    return provided.length===token.length && crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(token));
  }
  return !secret && !token && process.env.NODE_ENV!=='production';
}

startN03PeerRegistration();

export default async function handler(req:any,res:any){
  if(req.method==='GET') return res.status(200).json({ok:true,nucleus:NUCLEUS_ID,mesh:'soul-mesh/1',contractVersion:SOUL_MESH_CONTRACT_VERSION,geminiConfigured:geminiConfigured(),peers:[...PEERS],...channels,capabilities:declaredCapabilities(),agents:router.listAgents(),residentAgent:N03_RESIDENT_AGENT,whisper:describeWhisperAdapter(),kokoro:describeKokoroAdapter()});
  if(req.method!=='POST') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const m=req.body;
  if(!m || typeof m!=='object' || typeof (m as any).timestamp!=='number' || Math.abs(Date.now()-(m as any).timestamp)>MAX_CLOCK_SKEW_MS) return res.status(400).json({error:'INVALID_SOUL_MESH_TIMESTAMP'});
  if(!validateMessage(m) || !NUCLEI.has(m.source) || m.target!==NUCLEUS_ID) return res.status(400).json({error:'INVALID_SOUL_MESH_MESSAGE'});
  if(!meshAuthorized(req,m)) return res.status(401).json({error:'UNAUTHORIZED'});
  if(m.capability?.startsWith('sara.')){try{return response(res,m,m.capability,await callSara(m.capability,m.payload,m.correlationId));}catch(error:any){return response(res,m,m.capability,{code:error?.message||'SARA_REQUEST_FAILED'},502);}}
  if(m.kind!=='request') return response(res,m,m.capability,{accepted:true});
  if(!acceptOnce(m.id)) return response(res,m,m.capability,{code:'REPLAY_DETECTED'},409);
  try { const payload=await router.dispatch(m); return response(res,m,m.capability,payload); }
  catch(error:any){ const code=error?.message||'N03_CAPABILITY_FAILED'; const status=code.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')||code.startsWith('AGENT_NOT_AVAILABLE')?501:502; return response(res,m,m.capability,{code,provider:code.startsWith('GEMINI_')?'gemini':undefined},status); }
}
