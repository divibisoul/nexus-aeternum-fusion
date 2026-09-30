import { randomUUID } from 'node:crypto';
import { isClareiraPacket, type ClareiraMetrics, type ClareiraPacket } from '../../shared/clareira-contract';
import { SoulMeshPeerClient } from '../../lib/soul-mesh/SoulMeshPeerClient';

let ingested=0, processed=0, dropped=0, errored=0, inFlight=0, lastLatency=0, startedAt=Date.now();
const samples:number[]=[];

const peers = new SoulMeshPeerClient('N03');

export function ingestClareiraPacket(packet:ClareiraPacket): boolean {
  if (!isClareiraPacket(packet)) throw new Error('INVALID_CLAREIRA_PACKET');
  ingested++; inFlight++;
  return true;
}

export async function forwardClareiraToN01(packet:ClareiraPacket): Promise<unknown> {
  ingestClareiraPacket(packet);
  try {
    const response = await peers.request('N01', 'clareira.ingest', { packet }, packet.correlationId || randomUUID());
    processed++; inFlight=Math.max(0,inFlight-1);
    lastLatency=Math.max(0,Date.now()-packet.timestamp); samples.push(lastLatency); if(samples.length>128)samples.shift();
    return response.payload;
  } catch (error) {
    errored++; inFlight=Math.max(0,inFlight-1);
    throw error;
  }
}

export function recordClareiraDrop(packet: ClareiraPacket, reason: string) {
  if (!isClareiraPacket(packet)) throw new Error('INVALID_CLAREIRA_PACKET');
  dropped++;
  inFlight=Math.max(0,inFlight-1);
  return { correlationId: packet.correlationId, reason };
}

export function clareiraMetrics(): ClareiraMetrics {
  const a=[...samples].sort((x,y)=>x-y);
  const pct=(p:number)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;
  return {
    capturedAtMs:Date.now(),
    nodes:{total:1,active:errored===0?1:0,errored},
    channels:{total:1,open:process.env.SOUL_MESH_N01_URL?.trim()?1:0},
    packets:{ingested,forwarded:processed,processed,dropped,errored,inFlight},
    latencyMs:{last:lastLatency,p50:pct(.5),p95:pct(.95),max:a[a.length-1]??0},
    uptimeMs:Date.now()-startedAt,
  };
}
