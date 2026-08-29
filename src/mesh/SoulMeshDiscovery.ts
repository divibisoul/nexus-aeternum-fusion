import { MESH_PEERS,type SoulNucleus } from './SoulMeshProtocol';
const KEY='soul-mesh:n03:peers';
export type PeerRecord={nucleus:SoulNucleus;url:string;updatedAt:number};
function storage():Storage|undefined{return typeof globalThis.localStorage!=='undefined'?globalThis.localStorage:undefined;}
function validPeer(value:unknown):value is PeerRecord{if(!value||typeof value!=='object')return false;const p=value as Record<string,unknown>;return typeof p.nucleus==='string'&&(MESH_PEERS as readonly string[]).includes(p.nucleus)&&typeof p.url==='string'&&p.url.length>0&&p.url.length<=2048&&typeof p.updatedAt==='number'&&Number.isFinite(p.updatedAt);}
export class SoulMeshDiscovery {
 async getAll():Promise<PeerRecord[]>{const store=storage();if(!store)return[];try{const raw=store.getItem(KEY);if(!raw)return[];const parsed:unknown=JSON.parse(raw);return Array.isArray(parsed)?parsed.filter(validPeer):[];}catch{return[];}}
 async set(peer:PeerRecord){if(!validPeer(peer))throw new Error('INVALID_MESH_PEER');const store=storage();if(!store)return;const peers=(await this.getAll()).filter(p=>p.nucleus!==peer.nucleus);peers.push(peer);store.setItem(KEY,JSON.stringify(peers));}
 peers(){return [...MESH_PEERS];}
}
