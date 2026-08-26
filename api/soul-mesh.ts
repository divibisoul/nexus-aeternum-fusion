import { createResponse, handleMeshMessage, type SoulMeshMessage } from '../lib/soul-mesh/endpoint';
import { N03_SERVER_CAPABILITIES } from '../src/soul-mesh/server-capability-handlers';

const NUCLEUS_ID = 'N03' as const;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const token = process.env.SOUL_MESH_TOKEN;
  if (!token) return res.status(503).json({ error: 'MESH_AUTH_NOT_CONFIGURED' });
  if (req.headers.authorization !== `Bearer ${token}`) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const result = await handleMeshMessage(req.body as SoulMeshMessage, N03_SERVER_CAPABILITIES);
    return res.status(result.kind === 'error' ? 422 : 200).json(result);
  } catch (error) {
    const body = req.body as Partial<SoulMeshMessage>;
    if (body?.source && body?.correlationId && body?.capability) {
      const safeMessage = {
        protocol: 'soul-mesh/1' as const,
        id: typeof body.id === 'string' ? body.id : crypto.randomUUID(),
        correlationId: body.correlationId,
        source: body.source,
        target: NUCLEUS_ID,
        kind: 'request' as const,
        capability: body.capability,
        payload: body.payload,
        timestamp: Date.now(),
      };
      return res.status(400).json(createResponse(safeMessage as SoulMeshMessage, 'error', {
        code: error instanceof Error ? error.message : 'INVALID_MESH_MESSAGE',
      }));
    }
    return res.status(400).json({ error: error instanceof Error ? error.message : 'INVALID_MESH_MESSAGE' });
  }
}
