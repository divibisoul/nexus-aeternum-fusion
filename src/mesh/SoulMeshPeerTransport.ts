import { MESH_PEERS, NUCLEUS_ID, type SoulNucleus } from './SoulMeshProtocol';
export function validatePeer(source:string,target:string):boolean { return MESH_PEERS.includes(source as SoulNucleus) && target===NUCLEUS_ID && source!==NUCLEUS_ID; }
export function peerChannels(){ return MESH_PEERS.flatMap(peer=>[`N03.IN.${peer}`,`N03.OUT.${peer}`]); }
