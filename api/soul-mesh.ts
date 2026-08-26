const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01','N02','N04','N05','N06'] as const;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  const token = process.env.SOUL_MESH_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const m = req.body;
  if (!m || m.protocol !== 'soul-mesh/1' || !m.id || !m.correlationId || !NUCLEI.has(m.source) || m.target !== NUCLEUS_ID || m.source === NUCLEUS_ID || !m.capability) return res.status(400).json({ error: 'INVALID_SOUL_MESH_MESSAGE' });
  if (m.kind !== 'request') return res.status(200).json({ accepted: true, correlationId: m.correlationId, source: NUCLEUS_ID, target: m.source });
  const response = (capability: string, payload: unknown) => res.status(200).json({ protocol:'soul-mesh/1', id:crypto.randomUUID(), correlationId:m.correlationId, source:NUCLEUS_ID, target:m.source, kind:'response', capability, payload, timestamp:Date.now() });
  if (m.capability === 'mesh.ping') return response('mesh.ping', { ok:true, handler:'N03.mesh.ping', echoed:m.payload, processedAt:Date.now() });
  if (m.capability === 'mesh.describe') return response('mesh.describe', { nucleus:NUCLEUS_ID, peers:[...PEERS], inChannels:PEERS.map(p=>`N03.IN.${p}`), outChannels:PEERS.map(p=>`N03.OUT.${p}`), capabilities:['mesh.ping','mesh.describe'], status:'online' });
  return res.status(501).json({ protocol:'soul-mesh/1', id:crypto.randomUUID(), correlationId:m.correlationId, source:NUCLEUS_ID, target:m.source, kind:'error', capability:m.capability, payload:{code:'CAPABILITY_HANDLER_NOT_REGISTERED',nucleus:NUCLEUS_ID}, timestamp:Date.now() });
}
