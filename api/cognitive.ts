import { createClient } from '@supabase/supabase-js';
import { N03N02CapabilityBridge } from '../src/soul-mesh/N03N02CapabilityBridge';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const bridge = new N03N02CapabilityBridge();

function bearer(req: any): string {
  const raw = typeof req.headers?.authorization === 'string' ? req.headers.authorization : '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('COGNITIVE_PAYLOAD_INVALID');
  }
  return value as Record<string, unknown>;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'AUTH_TOKEN_REQUIRED' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ error: 'SUPABASE_SERVER_AUTH_NOT_CONFIGURED' });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'AUTH_SESSION_INVALID' });

    const body = jsonRecord(req.body);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) return res.status(422).json({ error: 'COGNITIVE_TEXT_REQUIRED' });

    const requestedCorrelation = typeof req.headers['x-correlation-id'] === 'string'
      ? req.headers['x-correlation-id'].trim()
      : '';

    const payload = {
      text,
      mode: typeof body.mode === 'string' ? body.mode : undefined,
      useWebSearch: body.useWebSearch === true,
      isFullCognitionMode: body.isFullCognitionMode === true,
      attachmentNames: Array.isArray(body.attachmentNames)
        ? body.attachmentNames.filter((value): value is string => typeof value === 'string').slice(0, 20)
        : [],
    };

    const message = await bridge.generate(payload);
    const result = jsonRecord(message.payload);
    const correlationId = message.correlationId;

    if (requestedCorrelation && requestedCorrelation !== correlationId) {
      return res.status(502).json({ error: 'COGNITIVE_CORRELATION_MISMATCH' });
    }

    return res.status(200).json({
      ok: true,
      nucleus: 'N03',
      authenticatedUserId: data.user.id,
      correlationId,
      providerNucleus: 'N02',
      capability: 'ai.generate',
      result,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'COGNITIVE_BACKEND_FAILED',
    });
  }
}
