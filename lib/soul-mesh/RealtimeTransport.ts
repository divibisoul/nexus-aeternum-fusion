import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface RealtimeEnvelope { protocol:'soul-mesh/1'; id:string; correlationId:string; source:string; target:string; kind:string; capability?:string; payload:unknown; timestamp:number|string; }
export interface RealtimeTransportOptions { url:string; key:string; topic:string; event:string; }

export class SoulMeshRealtimeTransport {
  private readonly client: SupabaseClient;
  private readonly options: RealtimeTransportOptions;
  private channel: ReturnType<SupabaseClient['channel']> | null = null;
  constructor(options:RealtimeTransportOptions){this.options=options;this.client=createClient(options.url,options.key);}
  async connect(onMessage:(message:RealtimeEnvelope)=>void):Promise<void>{
    this.channel=this.client.channel(this.options.topic);
    this.channel.on('broadcast',{event:this.options.event},({payload})=>onMessage(payload as RealtimeEnvelope));
    await new Promise<void>((resolve,reject)=>this.channel!.subscribe(status=>status==='SUBSCRIBED'?resolve():status==='CHANNEL_ERROR'||status==='TIMED_OUT'?reject(new Error(`SOUL_MESH_REALTIME_${status}`)):undefined));
  }
  async send(message:RealtimeEnvelope):Promise<void>{if(!this.channel)throw new Error('REALTIME_NOT_CONNECTED');await this.channel.send({type:'broadcast',event:this.options.event,payload:message});}
  async close():Promise<void>{if(this.channel){await this.client.removeChannel(this.channel);this.channel=null;}}
}
