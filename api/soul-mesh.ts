const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  const m = req.body;
  if (!m || m.protocol !== 'soul-mesh/1' || !m.id || !m.correlationId || !NUCLEI.has(m.source) || m.target !== NUCLEUS_ID || m.source === NUCLEUS_ID) return res.status(400).json({ error: 'INVALID_SOUL_MESH_MESSAGE' });
  if (m.kind !== 'request') return res.status(200).json({ accepted: true, correlationId: m.correlationId, source: NUCLEUS_ID, target: m.source });
  if (!m.capability) return res.status(400).json({ error: 'MISSING_CAPABILITY', correlationId: m.correlationId });
  return res.status(200).json({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: m.correlationId, source: NUCLEUS_ID, target: m.source, kind: 'response', capability: m.capability, payload: { nucleus: NUCLEUS_ID, accepted: true, execution: 'runtime-required', receivedAt: Date.now() }, timestamp: Date.now() });
}
