import type { SoulNucleus } from './SoulMeshProtocol';
export const R2_PEER_ENDPOINTS: Record<Exclude<SoulNucleus,'nexus'>,{in:string;out:string}> = {
  aeternum:{in:'/soul-mesh/aeternum/in',out:'/soul-mesh/aeternum/out'},
  eternium:{in:'/soul-mesh/eternium/in',out:'/soul-mesh/eternium/out'},
  chatbot:{in:'/soul-mesh/chatbot/in',out:'/soul-mesh/chatbot/out'},
  chatbots:{in:'/soul-mesh/chatbots/in',out:'/soul-mesh/chatbots/out'},
  'chatbot-2000':{in:'/soul-mesh/chatbot-2000/in',out:'/soul-mesh/chatbot-2000/out'},
};
