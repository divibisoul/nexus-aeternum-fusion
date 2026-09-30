import { N03N02CapabilityBridge } from '../src/soul-mesh/N03N02CapabilityBridge';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(process.env.SUPABASE_ANON_KEY || '').trim();
const MAX_BODY_BYTES = 6 * 1024 * 1024;

type ChatAttachment = { name?: unknown; mimeType?: unknown; data?: unknown; size?: unknown };
type ChatRequest = {
  text?: unknown;
  attachments?: unknown;
  systemInstruction?: unknown;
  correlationId?: unknown;
};

function json(res: any, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

async function authenticate(req: any): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  const authorization = typeof req.headers?.authorization === 'string' ? req.headers.authorization.trim() : '';
  if (!/^Bearer\s+/i.test(authorization)) return false;
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return response.ok;
}

function decodeAttachments(value: unknown): Array<{ name: string; mimeType: string; data: string; size: number }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ name: string; mimeType: string; data: string; size: number }> = [];
  for (const item of value as ChatAttachment[]) {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const mimeType = typeof item?.mimeType === 'string' ? item.mimeType.trim() : '';
    const data = typeof item?.data === 'string' ? item.data.trim() : '';
    const size = typeof item?.size === 'number' && Number.isFinite(item.size) ? item.size : 0;
    if (!name || !mimeType || !data) throw new Error('INVALID_ATTACHMENT');
    out.push({ name, mimeType, data, size });
  }
  return out;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  if (!(await authenticate(req))) return json(res, 401, { error: 'AUTHENTICATED_SESSION_REQUIRED' });

  const body = req.body as ChatRequest | undefined;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const attachments = decodeAttachments(body?.attachments);
  if (!text && attachments.length === 0) return json(res, 400, { error: 'CHAT_INPUT_REQUIRED' });

  const correlationId =
    typeof body?.correlationId === 'string' && body.correlationId.trim()
      ? body.correlationId.trim()
      : crypto.randomUUID();

  const startedAt = Date.now();
  const bridge = new N03N02CapabilityBridge();

  try {
    let result: any;
    if (attachments.length === 0) {
      result = await bridge.geminiText({
        text,
        ...(typeof body?.systemInstruction === 'string' && body.systemInstruction.trim()
          ? { systemInstruction: body.systemInstruction.trim() }
          : {}),
      });
    } else {
      result = await bridge.geminiMultimodal({
        contents: [{
          role: 'user',
          parts: [
            ...attachments.map(file => ({
              inlineData: { mimeType: file.mimeType, data: file.data },
            })),
            ...(text ? [{ text }] : []),
          ],
        }],
      });
    }

    const payload = result?.payload as Record<string, unknown> | undefined;
    const output = typeof payload?.text === 'string' ? payload.text.trim() : '';
    if (!output) return json(res, 502, {
      error: 'GEMINI_EMPTY_RESPONSE',
      correlationId: result?.correlationId ?? correlationId,
    });

    return json(res, 200, {
      content: output,
      correlationId: result?.correlationId ?? correlationId,
      provider: 'N02',
      transport: 'SOUL_MESH',
      capability: attachments.length === 0 ? 'gemini.text.generate' : 'gemini.multimodal.generate',
      latencyMs: Date.now() - startedAt,
      observed: true,
      dataSource: 'GEMINI_PROVIDER_RESPONSE',
    });
  } catch (error) {
    return json(res, 502, {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
      latencyMs: Date.now() - startedAt,
    });
  }
}
