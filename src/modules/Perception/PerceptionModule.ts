/**
 * AETERNUM M5 - PERCEPTION MODULE
 *
 * Neural perception facade for the N03 nucleus.
 *
 * Important:
 * - The N03 runtime/capability registry remains authoritative.
 * - This module does not fabricate image/audio/video results.
 * - The local nervoVago/hortaCore/wormhole objects are a compatibility
 *   fabric for this 10-file lot only; they do not replace Soul Mesh/N03 core.
 * - Real perception work is delegated through an injected executor.
 */

import { N03_AUDIO_CAPABILITIES } from "../../mesh/N03AudioCapabilityRegistry";

export type NeuralEvent = (payload?: unknown) => void;
export type EventSubscription = () => void;

export class NeuralEventBus {
  private readonly listeners = new Map<string, Set<NeuralEvent>>();

  on(event: string, listener: NeuralEvent): EventSubscription {
    const listeners = this.listeners.get(event) ?? new Set<NeuralEvent>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(event);
    };
  }

  emit(event: string, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      try {
        listener(payload);
      } catch (error) {
        // A subscriber must not break the rest of the neural bus.
        this.emit("network.listener.error", { event, error: String(error) });
      }
    }
  }

  getRegisteredEvents(): string[] {
    return [...this.listeners.keys()];
  }
}

export class NeuralStateStore {
  private readonly state = new Map<string, unknown>();

  get<T = unknown>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  set<T = unknown>(key: string, value: T): void {
    this.state.set(key, value);
  }

  has(key: string): boolean {
    return this.state.has(key);
  }

  entries(): Array<[string, unknown]> {
    return [...this.state.entries()];
  }
}

export type NeuralRegistration = {
  type: "engine" | "service" | "monitor" | "ui";
  version: string;
  capabilities: string[];
  dependencies: string[];
};

export class NeuralWormholeRegistry {
  private readonly registry = new Map<string, { instance: unknown; metadata: NeuralRegistration }>();

  register(id: string, instance: unknown, metadata: Partial<NeuralRegistration> = {}): void {
    this.registry.set(id, {
      instance,
      metadata: {
        type: metadata.type ?? "service",
        version: metadata.version ?? "1.0.0",
        capabilities: metadata.capabilities ?? [],
        dependencies: metadata.dependencies ?? ["nervoVago", "hortaCore"],
      },
    });
  }

  get<T = unknown>(id: string): T | undefined {
    return this.registry.get(id)?.instance as T | undefined;
  }

  list(): string[] {
    return [...this.registry.keys()];
  }

  describe(id: string): NeuralRegistration | undefined {
    return this.registry.get(id)?.metadata;
  }
}

export const nervoVago = new NeuralEventBus();
export const hortaCore = new NeuralStateStore();
export const wormhole = new NeuralWormholeRegistry();

export type PerceptionExecutor = (
  capability: string,
  payload: unknown,
) => Promise<unknown>;

export type PerceptionEvent = {
  type: string;
  payload: unknown;
  correlationId?: string;
};

export type PerceptionResult = {
  status: "completed" | "handler_not_bound" | "adapter_required" | "unsupported";
  capability: string;
  correlationId?: string;
  result?: unknown;
  error?: string;
};

const AUDIO_CAPABILITIES = new Map(
  N03_AUDIO_CAPABILITIES.map((capability) => [capability.id, capability]),
);

export class PerceptionModule {
  readonly id = "M5_PERCEPTION";
  private active = false;
  private readonly processingQueue: Array<{ id: string; kind: string; startedAt: number }> = [];

  constructor(private readonly executor?: PerceptionExecutor) {
    wormhole.register(this.id, this, {
      type: "engine",
      version: "2.0.0",
      capabilities: [
        "image-analysis",
        "audio-transcription",
        "video-analysis",
        "multimodal",
      ],
    });

    nervoVago.on("perception.activate", () => this.activate());
    nervoVago.on("perception.deactivate", () => this.deactivate());
    nervoVago.on("perception.image.process", (data) => {
      void this.processImage(data as { file: File; context?: string; mode?: string; correlationId?: string });
    });
    nervoVago.on("perception.audio.process", (data) => {
      void this.processAudio(data as { file: File; mode?: string; correlationId?: string });
    });
    nervoVago.on("perception.video.process", (data) => {
      void this.processVideo(data as { file: File; mode?: string; correlationId?: string });
    });
  }

  activate(): void {
    this.active = true;
    hortaCore.set("perception.active", true);
    hortaCore.set("perception.activatedAt", Date.now());
    nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    hortaCore.set("perception.active", false);
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  isActive(): boolean {
    return this.active;
  }

  capabilities() {
    return N03_AUDIO_CAPABILITIES.map((item) => ({ ...item }));
  }

  getQueue() {
    return this.processingQueue.map((item) => ({ ...item }));
  }

  async handle(event: PerceptionEvent): Promise<PerceptionResult> {
    if (!this.active) {
      return {
        status: "unsupported",
        capability: event.type,
        correlationId: event.correlationId,
        error: "M5_PERCEPTION is inactive",
      };
    }

    const capability = event.type.startsWith("perception.")
      ? event.type.slice("perception.".length)
      : event.type;

    const descriptor = AUDIO_CAPABILITIES.get(capability);

    if (descriptor && !this.executor) {
      return {
        status: descriptor.status === "implemented" ? "handler_not_bound" : "adapter_required",
        capability,
        correlationId: event.correlationId,
      };
    }

    if (!descriptor && !this.executor) {
      return {
        status: "adapter_required",
        capability,
        correlationId: event.correlationId,
      };
    }

    if (!this.executor) {
      return {
        status: "handler_not_bound",
        capability,
        correlationId: event.correlationId,
      };
    }

    try {
      const result = await this.executor(capability, event.payload);
      return {
        status: "completed",
        capability,
        correlationId: event.correlationId,
        result,
      };
    } catch (error) {
      return {
        status: "handler_not_bound",
        capability,
        correlationId: event.correlationId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async processImage(data: {
    file: File;
    context?: string;
    mode?: string;
    correlationId?: string;
  }): Promise<void> {
    await this.processFile("image", data.file, "image.analyze", data);
  }

  private async processAudio(data: {
    file: File;
    mode?: string;
    correlationId?: string;
  }): Promise<void> {
    await this.processFile("audio", data.file, "audio.transcribe", data);
  }

  private async processVideo(data: {
    file: File;
    mode?: string;
    correlationId?: string;
  }): Promise<void> {
    await this.processFile("video", data.file, "video.analyze", data);
  }

  private async processFile(
    kind: string,
    file: File,
    capability: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!this.active) {
      nervoVago.emit("perception.error", {
        message: "M5_PERCEPTION is inactive",
        kind,
        file: file.name,
      });
      return;
    }

    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    this.processingQueue.push({ id, kind, startedAt });
    nervoVago.emit(`perception.${kind}.started`, {
      id,
      file: file.name,
      timestamp: startedAt,
    });

    const result = await this.handle({
      type: `perception.${capability}`,
      payload: {
        file,
        metadata: {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          ...data,
        },
      },
      correlationId: id,
    });

    const queueIndex = this.processingQueue.findIndex((item) => item.id === id);
    if (queueIndex >= 0) this.processingQueue.splice(queueIndex, 1);

    const payload = {
      ...result,
      file: file.name,
      latency: Date.now() - startedAt,
      mode: data.mode,
      correlationId: id,
    };

    if (kind === "image") nervoVago.emit("perception.image.analyzed", payload);
    if (kind === "audio") nervoVago.emit("perception.audio.transcribed", payload);
    if (kind === "video") nervoVago.emit("perception.video.analyzed", payload);

    if (result.status !== "completed") {
      nervoVago.emit("perception.error", {
        message: `Perception ${kind} not completed`,
        ...payload,
      });
    }
  }
}

export const perceptionModule = new PerceptionModule();
