export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;

export interface SoulMeshHttpMessage {
  protocol:string;
  contractVersion:string;
  id:string;
  correlationId:string;
  source:string;
  target:string;
  kind:string;
  capability?:string;
  payload:unknown;
  timestamp:number|string;
}

export interface HttpTransportOptions {
  endpoint:string;
  timeoutMs?:number;
  maxRetries?:number;
  retryBaseDelayMs?:number;
  headers?:Record<string,string>;
}

/** Serverless-safe HTTP transport: bounded timeout/retry, no background loops. */
export class SoulMeshHttpTransport {
  private readonly endpoint:string;
  private readonly timeoutMs:number;
  private readonly maxRetries:number;
  private readonly retryBaseDelayMs:number;
  private readonly headers:Record<string,string>;

  constructor(options:HttpTransportOptions){
    this.endpoint=options.endpoint;
    this.timeoutMs=options.timeoutMs??15000;
    this.maxRetries=Math.max(0,Math.min(options.maxRetries??3,3));
    this.retryBaseDelayMs=Math.max(0,options.retryBaseDelayMs??250);
    this.headers={'content-type':'application/json',...(options.headers??{})};
  }

  async send(message:SoulMeshHttpMessage):Promise<SoulMeshHttpMessage>{
    if(message.contractVersion!==SOUL_MESH_CONTRACT_VERSION) throw new Error('SOUL_MESH_CONTRACT_VERSION_MISMATCH');
    let lastError:unknown;
    for(let attempt=0;attempt<=this.maxRetries;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
      try{
        const requestHeaders={...this.headers,'x-request-id':message.correlationId};
        const r=await fetch(this.endpoint,{method:'POST',headers:requestHeaders,body:JSON.stringify(message),signal:controller.signal});
        const body=await r.json() as SoulMeshHttpMessage;
        if(!r.ok){
          const retryable=r.status>=500;
          if(!retryable || attempt===this.maxRetries) throw new Error(`SOUL_MESH_HTTP_${r.status}`);
          throw new Error(`SOUL_MESH_RETRYABLE_${r.status}`);
        }
        if(body.contractVersion!==SOUL_MESH_CONTRACT_VERSION) throw new Error('SOUL_MESH_CONTRACT_VERSION_MISMATCH');
        if(body.correlationId!==message.correlationId)throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
        return body;
      }catch(error){
        lastError=error;
        const detail=error instanceof Error?error.message:String(error);
        const retryable=detail.startsWith('SOUL_MESH_HTTP_5')||detail.startsWith('SOUL_MESH_RETRYABLE_')||detail.includes('aborted')||detail.includes('fetch');
        if(!retryable||attempt===this.maxRetries) throw error;
        const delay=this.retryBaseDelayMs*Math.pow(2,attempt);
        if(delay>0) await new Promise(resolve=>setTimeout(resolve,delay));
      }finally{clearTimeout(timer);}
    }
    throw lastError instanceof Error?lastError:new Error('SOUL_MESH_HTTP_FAILED');
  }
}
