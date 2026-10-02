import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const WHISPER_CAPABILITY = 'audio.transcribe.whisper@1.0.0' as const;
export const WHISPER_REVISION = '86098128c0b4f24f0e2aa2994de830614b474227' as const;

export type WhisperState = 'PASS' | 'FAIL' | 'DEGRADED';

export interface WhisperAudioInput {
  data: string;
  mimeType: string;
  language?: string;
  task?: 'transcribe' | 'translate';
  wordTimestamps?: boolean;
  initialPrompt?: string;
}

export interface WhisperAdapterEvidence {
  state: WhisperState;
  code?: string;
  provider: 'openai/whisper';
  revision: typeof WHISPER_REVISION;
  modelPath?: string;
  device: string;
  adapterEnabled: boolean;
  modelPresent: boolean;
  runnerRootPresent: boolean;
}

function env(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

function enabled(): boolean {
  return /^(1|true|yes)$/i.test(env('SOUL_N03_WHISPER_ENABLED'));
}

function config() {
  return {
    python: env('SOUL_N03_WHISPER_PYTHON', 'python3'),
    root: path.resolve(env('SOUL_N03_WHISPER_ROOT', 'integrations/soul-upstream/whisper')),
    modelPath: env('SOUL_N03_WHISPER_MODEL_PATH'),
    device: env('SOUL_N03_WHISPER_DEVICE', 'cpu'),
    timeoutMs: Math.max(5_000, Number.parseInt(env('SOUL_N03_WHISPER_TIMEOUT_MS', '120000'), 10) || 120_000),
    maxAudioBytes: Math.max(1_048_576, Number.parseInt(env('SOUL_N03_WHISPER_MAX_AUDIO_BYTES', '20000000'), 10) || 20_000_000),
  };
}

export function describeWhisperAdapter(): WhisperAdapterEvidence {
  const c = config();
  const rootPresent = fs.existsSync(c.root) && fs.statSync(c.root).isDirectory();
  const modelPresent = Boolean(c.modelPath) && fs.existsSync(path.resolve(c.modelPath)) && fs.statSync(path.resolve(c.modelPath)).isFile();

  if (!enabled()) {
    return { state: 'DEGRADED', code: 'WHISPER_ADAPTER_DISABLED', provider: 'openai/whisper', revision: WHISPER_REVISION, device: c.device, adapterEnabled: false, modelPresent, runnerRootPresent: rootPresent };
  }
  if (!rootPresent) {
    return { state: 'DEGRADED', code: 'WHISPER_SOURCE_NOT_AVAILABLE', provider: 'openai/whisper', revision: WHISPER_REVISION, modelPath: c.modelPath || undefined, device: c.device, adapterEnabled: true, modelPresent, runnerRootPresent: false };
  }
  if (!modelPresent) {
    return { state: 'DEGRADED', code: 'WHISPER_MODEL_NOT_AVAILABLE', provider: 'openai/whisper', revision: WHISPER_REVISION, modelPath: c.modelPath || undefined, device: c.device, adapterEnabled: true, modelPresent: false, runnerRootPresent: true };
  }
  return { state: 'PASS', provider: 'openai/whisper', revision: WHISPER_REVISION, modelPath: path.resolve(c.modelPath), device: c.device, adapterEnabled: true, modelPresent: true, runnerRootPresent: true };
}

export function isWhisperAdapterExecutable(): boolean {
  return describeWhisperAdapter().state === 'PASS';
}

function extensionForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';', 1)[0];
  const map: Record<string, string> = {
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm',
    'audio/flac': '.flac',
    'audio/aac': '.aac',
  };
  return map[normalized] ?? '.audio';
}

export async function transcribeWithWhisper(input: WhisperAudioInput): Promise<Record<string, unknown>> {
  const evidence = describeWhisperAdapter();
  if (evidence.state !== 'PASS') return { ...evidence, capability: WHISPER_CAPABILITY };

  let audio: Buffer;
  try {
    audio = Buffer.from(input.data, 'base64');
  } catch {
    return { state: 'FAIL', code: 'WHISPER_AUDIO_BASE64_INVALID', capability: WHISPER_CAPABILITY, ...evidence };
  }

  const c = config();
  if (audio.length === 0 || audio.length > c.maxAudioBytes) {
    return { state: 'FAIL', code: audio.length === 0 ? 'WHISPER_AUDIO_EMPTY' : 'WHISPER_AUDIO_TOO_LARGE', capability: WHISPER_CAPABILITY, ...evidence };
  }

  const tempDir = await fs.promises.mkdtemp(path.join(process.env.TMPDIR || '/tmp', 'soul-whisper-'));
  const audioPath = path.join(tempDir, `input${extensionForMimeType(input.mimeType)}`);
  const runner = path.resolve('scripts/whisper_runner.py');

  try {
    await fs.promises.writeFile(audioPath, audio, { mode: 0o600 });

    const payload = JSON.stringify({
      audioPath,
      language: input.language,
      task: input.task ?? 'transcribe',
      wordTimestamps: input.wordTimestamps ?? false,
      initialPrompt: input.initialPrompt,
      modelPath: path.resolve(c.modelPath),
      root: c.root,
      device: c.device,
    });

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
        reject(new Error('WHISPER_TIMEOUT'));
      }, c.timeoutMs);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', (code, signal) => { clearTimeout(timer); resolve({ code, signal }); });
      child.stdin.end(payload);
    }).catch(error => ({ code: null, signal: null, error }));

    if ('error' in result && result.error) {
      const message = result.error instanceof Error ? result.error.message : String(result.error);
      const state: WhisperState = message === 'WHISPER_TIMEOUT' ? 'FAIL' : 'DEGRADED';
      return { state, code: message === 'WHISPER_TIMEOUT' ? 'WHISPER_TIMEOUT' : 'WHISPER_PROCESS_UNAVAILABLE', detail: message, stderr, capability: WHISPER_CAPABILITY, ...evidence };
    }

    if (result.code !== 0) {
      return { state: 'FAIL', code: 'WHISPER_PROCESS_FAILED', exitCode: result.code, signal: result.signal, stderr: stderr.slice(-4000), capability: WHISPER_CAPABILITY, ...evidence };
    }

    try {
      const output = JSON.parse(stdout.trim()) as Record<string, unknown>;
      return { ...output, capability: WHISPER_CAPABILITY, providerRevision: WHISPER_REVISION };
    } catch {
      return { state: 'FAIL', code: 'WHISPER_INVALID_RUNNER_OUTPUT', stdout: stdout.slice(-4000), stderr: stderr.slice(-4000), capability: WHISPER_CAPABILITY, ...evidence };
    }
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
