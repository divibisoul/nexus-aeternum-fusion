import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

const topic = (import.meta.env.VITE_SOUL_MESH_TOPIC as string | undefined) ?? 'soul-mesh-v1';

/** Real bidirectional transport for Nexus using the existing Supabase Realtime project. */
export class SoulMeshSupabaseTransport implements SoulMeshTransport {
  private readonly channel: RealtimeChannel;
  private readonly handlers = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly ready: Promise<void>;

  constructor() {
    this.channel = supabase.channel(topic, { config: { broadcast: { ack: true, self: false } } });
    this.channel.on('broadcast', { event: 'soul-mesh' }, ({ payload }) => {
      if (!payload || typeof payload !== 'object') return;
      const message = payload as SoulMeshMessage;
      for (const handler of this.handlers) void Promise.resolve(handler(message));
    });
    this.ready = new Promise((resolve, reject) => {
      this.channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(error ?? new Error(`Soul Mesh channel ${status}`));
      });
    });
  }

  async send(message: SoulMeshMessage): Promise<void> {
    await this.ready;
    const result = await this.channel.send({ type: 'broadcast', event: 'soul-mesh', payload: message });
    if (result !== 'ok') throw new Error(`Soul Mesh broadcast failed: ${result}`);
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async close(): Promise<void> {
    await supabase.removeChannel(this.channel);
  }
}
