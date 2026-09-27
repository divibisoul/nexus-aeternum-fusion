import { supabase } from '@/integrations/supabase/client';

export type GeminiLiveToken = {
  token: string;
  model: string;
  expiresAt: string;
  newSessionExpiresAt: string;
};

export type GeminiLiveSessionOptions = {
  token: GeminiLiveToken;
  onOpen?: () => void;
  onMessage?: (message: MessageEvent<string>) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
};

const LIVE_WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';

export async function issueGeminiLiveToken(): Promise<GeminiLiveToken> {
  const { data, error } = await supabase.functions.invoke('gemini-live-token', {
    body: {},
  });
  if (error) throw new Error(`GEMINI_LIVE_TOKEN_REQUEST_FAILED:${error.message}`);
  if (!data?.token || !data?.model) throw new Error('GEMINI_LIVE_TOKEN_RESPONSE_INVALID');
  return data as GeminiLiveToken;
}

export class GeminiLiveClient {
  private readonly socket: WebSocket;

  constructor(options: GeminiLiveSessionOptions) {
    const url = `${LIVE_WS_BASE}?access_token=${encodeURIComponent(options.token.token)}`;
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', () => {
      this.socket.send(JSON.stringify({
        setup: { model: `models/${options.token.model}` },
      }));
      options.onOpen?.();
    });
    this.socket.addEventListener('message', event => options.onMessage?.(event as MessageEvent<string>));
    this.socket.addEventListener('error', event => options.onError?.(event));
    this.socket.addEventListener('close', event => options.onClose?.(event));
  }

  sendText(text: string, turnComplete = true) {
    const value = text.trim();
    if (!value) throw new Error('GEMINI_LIVE_TEXT_REQUIRED');
    this.socket.send(JSON.stringify({
      client_content: {
        turn_complete: turnComplete,
        turns: [{ role: 'user', parts: [{ text: value }] }],
      },
    }));
  }

  sendAudio(base64Audio: string, mimeType = 'audio/pcm;rate=16000') {
    if (!base64Audio.trim()) throw new Error('GEMINI_LIVE_AUDIO_REQUIRED');
    this.socket.send(JSON.stringify({
      realtime_input: {
        audio: { data: base64Audio, mime_type: mimeType },
      },
    }));
  }

  close(code = 1000, reason = '') {
    this.socket.close(code, reason);
  }

  get readyState() {
    return this.socket.readyState;
  }
}
