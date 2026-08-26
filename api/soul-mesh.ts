import { handleMeshMessage, type SoulMeshMessage, type NucleusId } from '../src/soul-mesh/endpoint';

const N03_HANDLERS: Record<string, (payload: unknown) => Promise<unknown> | unknown> = {
  'mesh.health': () => ({ nucleus: 'N03', status: 'ready', transport: 'hybrid' }),
  'mesh.capabilities': () => ({ nucleus: 'N03', source: 'runtime', note: 'Business handlers are registered by the N03 runtime; this endpoint never fabricates capability execution.' }),
};

function authorized(req: Request) {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  const expected = runtime.process?.env?.SOUL_MESH_TOKEN;
  if (!expected) return true;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: { 'content-type': 'application/json' } });
  if (!authorized(req)) return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401, headers: { 'content-type': 'application/json' } });
  try {
    const message = (await req.json()) as SoulMeshMessage;
    const response = await handleMeshMessage(message, 'N03' as NucleusId, N03_HANDLERS);
    return new Response(JSON.stringify(response), { status: response.kind === 'error' ? 422 : 200, headers: { 'content-type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'INVALID_MESH_MESSAGE' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
}
