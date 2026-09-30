import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { N07CognitiveBridge } from './N07CognitiveBridge';

const secret='n03-cognitive-secret-123456';
function nonce(){return crypto.randomUUID().replaceAll('-','').padEnd(32,'0').slice(0,32);}
function canonical(message:any, nonceValue:string){
  return JSON.stringify({protocol:message.protocol,contractVersion:message.contractVersion,id:message.id,correlationId:message.correlationId,source:message.source,target:message.target,kind:message.kind,capability:message.capability??'',payload:message.payload,timestamp:message.timestamp,transport:message.meta?.transport,meta:message.meta??null,nonce:nonceValue});
}
test('N03 cognitive bridge signs canonical Mesh and verifies N07 response', async () => {
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async (_input,init)=>{
    const request=JSON.parse(String(init?.body));
    assert.equal(request.capability,'cognitive.execute@1.0.0');
    assert.equal(request.meta.transport,'HTTP');
    assert.equal((init?.headers as Record<string,string>)['x-soul-mesh-hmac']?.length,64);
    const responseNonce=nonce();
    const response:any={protocol:'soul-mesh/1',contractVersion:'1.1.0',id:'n07-response',correlationId:request.correlationId,source:'N07',target:'N03',kind:'response',capability:request.capability,payload:{values:[4,5],status:'ok'},timestamp:Date.now(),meta:{runtime:'n07',transport:'HTTP',encoding:'json',version:'1.1.0',nonce:responseNonce,traceId:request.correlationId}};
    response.nonce=responseNonce;
    response.hmac=createHmac('sha256',secret).update(canonical(response,responseNonce)).digest('hex');
    return new Response(JSON.stringify(response),{status:200,headers:{'content-type':'application/json','x-soul-mesh-nonce':responseNonce,'x-soul-mesh-hmac':response.hmac}});
  };
  try {
    const bridge=new N07CognitiveBridge('https://n07.test',secret);
    const result=await bridge.execute({payload:[1,2,3],correlationId:'corr-n03'});
    assert.deepEqual(result.payload,[4,5]);
    assert.equal(result.correlationId,'corr-n03');
  } finally { globalThis.fetch=oldFetch; }
});
