import type { SoulMeshMessage } from './SoulMeshProtocol';
export type TransportState='closed'|'open'|'half-open';
const DEFAULT_TIMEOUT_MS=15000;
const MAX_TIMEOUT_MS=60000;
function boundedTimeout(ms:number){return Math.min(MAX_TIMEOUT_MS,Math.max(1000,Math.floor(ms)));}
function traceparent(message:SoulMeshMessage){const trace=message.correlationId.replace(/-/g,'').padEnd(32,'0').slice(0,32);const span=message.id.replace(/-/g,'').padEnd(16,'0').slice(0,16);return `00-${trace}-${span}-01`;}
export class SoulMeshHttpTransport {
  private failures=0;
  private state:TransportState='closed';
  constructor(private readonly maxFailures=3,private readonly resetMs=10000){}
  async send(url:string,message:SoulMeshMessage,token?:string,timeoutMs=DEFAULT_TIMEOUT_MS):Promise<Response>{
    if(this.state==='open') throw new Error('MESH_CIRCUIT_OPEN');
    const headers:Record<string,string>={'content-type':'application/json','accept':'application/json','x-soul-correlation-id':message.correlationId,'traceparent':traceparent(message)};
    if(token) headers.authorization=`Bearer ${token}`;
    let last:unknown;
    for(let attempt=0;attempt<3;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),boundedTimeout(timeoutMs));
      try{
        const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(message),signal:controller.signal});
        if(response.ok){this.failures=0;this.state='closed';return response;}
        last=new Error(`MESH_HTTP_${response.status}`);
        if(response.status>=400&&response.status<500&&response.status!==408&&response.status!==429) break;
      }catch(error){last=error;}
      finally{clearTimeout(timer);}
      if(attempt<2) await new Promise(r=>setTimeout(r,250*(2**attempt)));
    }
    this.failures++;
    if(this.failures>=this.maxFailures){this.state='open';setTimeout(()=>{this.state='half-open';},this.resetMs);}
    throw last instanceof Error?last:new Error(String(last));
  }
}
