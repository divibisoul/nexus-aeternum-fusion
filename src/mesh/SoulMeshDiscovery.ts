import { MESH_PEERS,type SoulNucleus } from './SoulMeshProtocol';
const KEY='soul-mesh:n03:peers';
export type PeerRecord={nucleus:SoulNucleus;url:string;updatedAt:number};
export class SoulMeshDiscovery { async getAll():Promise<PeerRecord[]>{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):[];}catch{return[];}} async set(peer:PeerRecord){const peers=(await this.getAll()).filter(p=>p.nucleus!==peer.nucleus);peers.push(peer);localStorage.setItem(KEY,JSON.stringify(peers));} peers(){return [...MESH_PEERS];} }
