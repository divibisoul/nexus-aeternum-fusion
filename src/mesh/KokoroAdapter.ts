import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const KOKORO_CAPABILITY = 'speech.synthesize.kokoro@1.0.0' as const;
export const KOKORO_REVISION = 'dfb907a02bba8152ca444717ca5d78747ccb4bec' as const;
export type KokoroState = 'PASS' | 'FAIL' | 'DEGRADED';

export interface KokoroTextInput {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  device?: string;
}

export interface KokoroAdapterEvidence {
  state: KokoroState;
  code?: string;
  provider: 'hexgrad/kokoro';
  revision: typeof KOKORO_REVISION;
  python: string;
  root: string;
  enabled: boolean;
  sourcePresent: boolean;
  language: string;
  voice: string;
  device: string;
}

function env(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

function enabled(): boolean {
  return /^(1|true|yes)$/i.test(env('SOUL_N03_KOKORO_ENABLED'));
}

function config() {
  return {
    python: env('SOUL_N03_KOKORO_PYTHON', 'python3'),
    root: path.resolve(env('SOUL_N03_KOKORO_ROOT', 'integrations/soul-upstream/kokoro')),
    language: env('SOUL_N03_KOKORO_LANG_CODE', 'p'),
    voice: env('SOUL_N03_KOKORO_VOICE'),
    device: env('SOUL_N03_KOKORO_DEVICE', 'cpu'),
    timeoutMs: Math.max(5_000, Number.parseInt(env('SOUL_N03_KOKORO_TIMEOUT_MS', '120000'), 10) || 120_000),
    maxTextLength: Math.max(256, Number.parseInt(env('SOUL_N03_KOKORO_MAX_TEXT_LENGTH', '12000'), 10) || 12000),
  };
}

export function describeKokoroAdapter(): KokoroAdapterEvidence {
  const c = config();
  const sourcePresent = fs.existsSync(c.root) && fs.statSync(c.root).isDirectory();
  if (!enabled()) {
    return {
      state: 'DEGRADED',
      code: 'KOKORO_ADAPTER_DISABLED',
      provider: 'hexgrad/kokoro',
      revision: KOKORO_REVISION,
      python: c.python,
      root: c.root,
      enabled: false,
      sourcePresent,
      language: c.language,
      voice: c.voice,
      device: c.device,
    };
  }
  if (!sourcePresent) {
    return {
      state: 'DEGRADED',
      code: 'KOKORO_SOURCE_NOT_AVAILABLE',
      provider: 'hexgrad/kokoro',
      revision: KOKORO_REVISION,
      python: c.python,
      root: c.root,
      enabled: true,
      sourcePresent: false,
      language: c.language,
      voice: c.voice,
      device: c.device,
    };
  }
  return {
    state: 'DEGRADED',
    code: 'KOKORO_EXECUTION_NOT_YET_PROVEN',
    provider: 'hexgrad/kokoro',
    revision: KOKORO_REVISION,
    python: c.python,
    root: c.root,
    enabled: true,
    sourcePresent: true,
    language: c.language,
    voice: c.voice,
    device: c.device,
  };
}

export function isKokoroAdapterConfigured(): boolean {
  const e = describeKokoroAdapter();
  return e.enabled && e.sourcePresent;
}

export async function synthesizeWithKokoro(input: KokoroTextInput): Promise<Record<string, unknown>> {
  const evidence = describeKokoroAdapter();
  if (!evidence.enabled || !evidence.sourcePresent) {
    return { ...evidence, capability: KOKORO_CAPABILITY };
  }

  const text = input.text.trim();
  const c = config();
  if (!text) {
    return { ...evidence, state: 'FAIL', code: 'KOKORO_TEXT_EMPTY', capability: KOKORO_CAPABILITY };
  }
  if (text.length > c.maxTextLength) {
    return { ...evidence, state: 'FAIL', code: 'KOKORO_TEXT_TOO_LARGE', maxTextLength: c.maxTextLength, capability: KOKORO_CAPABILITY };
  }

  const voice = (input.voice ?? c.voice).trim();
  if (!voice) {
    return { ...evidence, state: 'FAIL', code: 'KOKORO_VOICE_REQUIRED', capability: KOKORO_CAPABILITY };
  }

  const payload = JSON.stringify({
    text,
    langCode: (input.language ?? c.language).trim() || c.language,
    voice,
    speed: typeof input.speed === 'number' && Number.isFinite(input.speed) ? input.speed : 1,
    device: (input.device ?? c.device).trim() || c.device,
    root: c.root,
  });

  const runner = path.resolve('scripts/kokoro_runner.py');
  const child = spawn(c.python, [runner], { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });

  const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('KOKORO_TIMEOUT'));
    }, c.timeoutMs);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', (code, signal) => { clearTimeout(timer); resolve({ code, signal }); });
    child.stdin.end(payload);
  }).catch(error => ({ code: null, signal: null, error }));

  if ('error' in result && result.error) {
    const message = result.error instanceof Error ? result.error.message : String(result.error);
    return {
      state: message === 'KOKORO_TIMEOUT' ? 'FAIL' : 'DEGRADED',
      code: message === 'KOKORO_TIMEOUT' ? 'KOKORO_TIMEOUT' : 'KOKORO_PROCESS_UNAVAILABLE',
      detail: message,
      stderr: stderr.slice(-4000),
      capability: KOKORO_CAPABILITY,
      ...evidence,
    };
  }
  if (result.code !== 0) {
    return { ...evidence, state: 'FAIL',
      code: 'KOKORO_PROCESS_FAILED',
      exitCode: result.code,
      signal: result.signal,
      stderr: stderr.slice(-4000),
      capability: KOKORO_CAPABILITY,
      };
  }

  try {
    const output = JSON.parse(stdout.trim()) as Record<string, unknown>;
    return { ...output, capability: KOKORO_CAPABILITY, providerRevision: KOKORO_REVISION };
  } catch {
    return { ...evidence, state: 'FAIL',
      code: 'KOKORO_INVALID_RUNNER_OUTPUT',
      stdout: stdout.slice(-4000),
      stderr: stderr.slice(-4000),
      capability: KOKORO_CAPABILITY,
      };
  }
}
