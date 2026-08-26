const NUCLEUS_ID = 'N03' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01', 'N02', 'N04', 'N05', 'N06'] as const;
const CAPABILITIES = [
  'voice-input', 'voice-output', 'speech-processing', 'multimodal-input',
  'cognitive-ui', 'emotion-analysis', 'spiritual-wisdom', 'plant-knowledge',
  'ritual-knowledge', 'frequency-context', 'mesh-communication',
  'mesh.ping', 'mesh.describe', 'mesh.capabilities', 'mesh.invoke',
] as const;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  const token = process.env.SOUL_MESH_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const m = req.body;
  if (!m || m.protocol !== 'soul-mesh/1' || !m.id || !m.correlationId || !NUCLEI.has(m.source) || m.target !== NUCLEUS_ID || m.source === NUCLEUS_ID || !m.capability) {
    return res.status(400).json({ error: 'INVALID_SOUL_MESH_MESSAGE' });
  }
  if (m.kind !== 'request') return res.status(200).json({ accepted: true, correlationId: m.correlationId, source: NUCLEUS_ID, target: m.source });

  const response = (capability: string, payload: unknown) => res.status(200).json({
    protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: m.correlationId,
    source: NUCLEUS_ID, target: m.source, kind: 'response', capability, payload, timestamp: Date.now(),
  });

  if (m.capability === 'mesh.ping') return response('mesh.ping', { ok: true, handler: 'N03.mesh.ping', echoed: m.payload, processedAt: Date.now() });
  if (m.capability === 'mesh.describe' || m.capability === 'mesh.capabilities') {
    return response(m.capability, {
      nucleus: NUCLEUS_ID,
      peers: [...PEERS],
      inChannels: PEERS.map((p) => `N03.IN.${p}`),
      outChannels: PEERS.map((p) => `N03.OUT.${p}`),
      capabilities: CAPABILITIES,
      executable: CAPABILITIES.filter((c) => !c.startsWith('mesh.')),
      status: 'online',
    });
  }

  // The HTTP adapter delegates actual capability execution to the authenticated
  // Supabase Edge Mesh gateway. No capability is falsely reported as executed here.
  const gateway = process.env.SOUL_MESH_GATEWAY_URL;
  if (!gateway) {
    return res.status(501).json({
      protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: m.correlationId,
      source: NUCLEUS_ID, target: m.source, kind: 'error', capability: m.capability,
      payload: { code: 'MESH_GATEWAY_NOT_CONFIGURED', nucleus: NUCLEUS_ID }, timestamp: Date.now(),
    });
  }

  try {
    const upstream = await fetch(gateway, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        ...(req.headers.apikey ? { apikey: req.headers.apikey } : {}),
      },
      body: JSON.stringify(m),
    });
    const payload = await upstream.json();
    return res.status(upstream.status).json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'MESH_GATEWAY_UNREACHABLE', message: error instanceof Error ? error.message : String(error) });
  }
}
