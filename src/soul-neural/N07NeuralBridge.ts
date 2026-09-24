export type NeuralOperation = "neural.forward@1.0.0" | "neural.learn@1.0.0";
export type NeuralRequest = { operation: NeuralOperation; payload: number[]; correlationId?: string; deadlineMs?: number };
export type NeuralResponse = { traceId: string; correlationId: string; payload?: number[]; data?: unknown; status?: string };

type CanonicalEnvelope = {
  protocol: "soul-mesh/1"; contractVersion: "1.1.0"; id: string; correlationId: string;
  source: "N03"; target: "N07"; kind: "request"; capability: NeuralOperation;
  payload: { values: number[] }; timestamp: number;
  meta: { runtime: string; transport: "HTTP"; encoding: "json"; version: "1.1.0"; traceId: string };
};
const CONTRACT = "1.1.0" as const;
const PROTOCOL = "soul-mesh/1" as const;
const env = () => ((globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {});
const id = (prefix: string): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return prefix + '-' + Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
};
function canonicalWire(value: CanonicalEnvelope, nonce: string): string {
  return JSON.stringify({
    protocol:value.protocol, contractVersion:value.contractVersion, id:value.id, correlationId:value.correlationId,
    source:value.source, target:value.target, kind:value.kind, capability:value.capability, payload:value.payload,
    timestamp:value.timestamp, transport:value.meta.transport, meta:value.meta, nonce,
  });
}
async function hmacHex(data:string,secret:string):Promise<string>{
  if(secret.length<16)throw new Error("SOUL_MESH_HMAC_SECRET must contain at least 16 characters");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,"0")).join("");
}
export class N07NeuralBridge {
  private readonly url:string; private readonly secret:string; private readonly timeout:number;
  constructor(private readonly source:"N03",o:{baseUrl?:string;secret?:string;timeoutMs?:number}={}){
    this.url=(o.baseUrl??env().SOUL_N07_URL??"").replace(/\/$/,"");
    this.secret=o.secret??env().SOUL_MESH_HMAC_SECRET??"";
    this.timeout=o.timeoutMs??15000;
    if(!this.url)throw new Error("SOUL_N07_URL is required");
  }
  async invoke(request:NeuralRequest):Promise<NeuralResponse>{
    if(request.payload.length===0||request.payload.some(value=>!Number.isFinite(value)))throw new Error("neural payload must contain finite numbers");
    const correlationId=request.correlationId?.trim()||id("corr");
    const nonce=id("nonce").replaceAll("-","").padEnd(32,"0").slice(0,32);
    const envelope:CanonicalEnvelope={
      protocol:PROTOCOL,contractVersion:CONTRACT,id:id("msg"),correlationId,source:this.source,target:"N07",
      kind:"request",capability:request.operation,payload:{values:request.payload},timestamp:Date.now(),
      meta:{runtime:"nexus-aeternum-fusion",transport:"HTTP",encoding:"json",version:CONTRACT,traceId:correlationId}
    };
    const headers:Record<string,string>={
      "content-type":"application/json","accept":"application/json",
      "x-soul-contract-version":CONTRACT,"x-soul-correlation-id":correlationId,
    };
    if(this.secret){
      headers["x-soul-mesh-nonce"]=nonce;
      headers["x-soul-mesh-hmac"]=await hmacHex(canonicalWire(envelope,nonce),this.secret);
    }
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(1,request.deadlineMs??this.timeout));
    try{
      const response=await fetch(this.url+"/api/soul-mesh",{method:"POST",headers,body:JSON.stringify(envelope),signal:controller.signal});
      const result=await response.json() as Record<string,unknown>;
      if(!response.ok)throw new Error(String(result.error??('N07 Mesh request failed: '+response.status)));
      if(String(result.contractVersion)!==CONTRACT)throw new Error("N07 Mesh response contract mismatch");
      if(String(result.correlationId)!==correlationId)throw new Error("N07 Mesh correlation mismatch");
      const payload=result.payload as Record<string,unknown>|undefined;
      const values=Array.isArray(payload?.values)?payload.values.map(Number):undefined;
      return {traceId:String(result.id??envelope.id),correlationId,payload:values,data:result.payload,status:String(payload?.status??result.status??"ok")};
    }finally{clearTimeout(timer);}
  }
  forward(payload:number[],correlationId?:string){return this.invoke({operation:"neural.forward@1.0.0",payload,correlationId})}
  learn(input:number[],target:number[],correlationId?:string){if(input.length===0||input.length!==target.length)throw new Error("input and target dimensions must match");return this.invoke({operation:"neural.learn@1.0.0",payload:[...input,...target],correlationId})}
}