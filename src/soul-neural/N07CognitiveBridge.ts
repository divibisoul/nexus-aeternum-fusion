export type CognitiveRequest={payload:number[];operation?:string;correlationId?:string;deadlineMs?:number};
export type CognitiveResponse={traceId:string;correlationId:string;payload?:number[];data?:unknown;status?:string};
const CONTRACT='1.1.0' as const;
const PROTOCOL='soul-mesh/1' as const;

const id=(prefix:string)=>{
  const bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return prefix+'-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
};

type WireEnvelope={
  protocol:typeof PROTOCOL; contractVersion:typeof CONTRACT; id:string; correlationId:string;
  source:'N03'; target:'N07'; kind:'request'; capability:string; payload:{values:number[]};
  timestamp:number; meta:{runtime:string;transport:'HTTP';encoding:'json';version:typeof CONTRACT;traceId:string};
};

const canonical=(message:WireEnvelope,nonce:string)=>JSON.stringify({
  protocol:message.protocol,contractVersion:message.contractVersion,id:message.id,correlationId:message.correlationId,
  source:message.source,target:message.target,kind:message.kind,capability:message.capability,
  payload:message.payload,timestamp:message.timestamp,transport:message.meta.transport,meta:message.meta,nonce,
});

async function hmacHex(data:string,secret:string){
  if(secret.length<16)throw new Error('SOUL_MESH_HMAC_SECRET must contain at least 16 characters');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature),b=>b.toString(16).padStart(2,'0')).join('');
}

export class N07CognitiveBridge {
  constructor(private readonly url:string, private readonly secret:string) {}

  async execute(r:CognitiveRequest):Promise<CognitiveResponse>{
    if(r.payload.length===0||r.payload.some(v=>!Number.isFinite(v)))throw new Error('cognitive payload must contain finite numbers');
    const correlationId=r.correlationId?.trim()||id('corr');
    const capability=(r.operation?.trim()||'cognitive.execute@1.0.0');
    const nonce=id('nonce').replaceAll('-','').padEnd(32,'0').slice(0,32);
    const envelope:WireEnvelope={
      protocol:PROTOCOL,contractVersion:CONTRACT,id:id('msg'),correlationId,source:'N03',target:'N07',
      kind:'request',capability,payload:{values:r.payload},timestamp:Date.now(),
      meta:{runtime:'nexus-aeternum-fusion',transport:'HTTP',encoding:'json',version:CONTRACT,traceId:correlationId}
    };
    const headers:Record<string,string>={
      'content-type':'application/json','accept':'application/json',
      'x-soul-contract-version':CONTRACT,'x-soul-correlation-id':correlationId,
    };
    if(this.secret){
      headers['x-soul-mesh-nonce']=nonce;
      headers['x-soul-mesh-hmac']=await hmacHex(canonical(envelope,nonce),this.secret);
    }
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),Math.max(1,r.deadlineMs??15000));
    try{
      const response=await fetch(this.url.replace(/\/$/,'')+'/api/soul-mesh',{method:'POST',headers,body:JSON.stringify(envelope),signal:controller.signal});
      const output=await response.json() as Record<string,unknown>;
      if(!response.ok)throw new Error(String(output.error??('N07 Mesh request failed: '+response.status)));
      if(String(output.contractVersion)!==CONTRACT)throw new Error('N07 Mesh response contract mismatch');
      if(String(output.correlationId)!==correlationId)throw new Error('N07 correlation mismatch');
      const payload=output.payload as Record<string,unknown>|undefined;
      const values=Array.isArray(payload?.values)?payload.values.map(Number):undefined;
      return {
        traceId:String(output.id??envelope.id),
        correlationId,
        payload:values,
        data:output.payload,
        status:String(payload?.status??output.status??'ok')
      };
    }finally{clearTimeout(timer);}
  }
}
