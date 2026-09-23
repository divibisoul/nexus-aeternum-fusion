import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export type MultimodalInput = {
  type: "text" | "image" | "audio" | "video";
  content: unknown;
  correlationId: string;
};

export class MultimodalInputModule {
  readonly id = "multimodal-input";
  private active = false;
  private readonly pendingInputs = new Map<string, MultimodalInput[]>();

  constructor() {
    wormhole.register(this.id, this, {
      type: "service",
      version: "1.0.0",
      capabilities: ["multimodal-input", "input-synchronization", "coordination"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("multimodal.activate", () => this.activate());
    nervoVago.on("multimodal.deactivate", () => this.deactivate());
    nervoVago.on("multimodal.input", (data) => this.handleInput(data as MultimodalInput));
    nervoVago.on("multimodal.flush", () => this.flush());
  }

  activate(): void {
    this.active = true;
    hortaCore.set(`${this.id}.active`, true);
    nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.flush();
    this.active = false;
    hortaCore.set(`${this.id}.active`, false);
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  handleInput(data: MultimodalInput): void {
    if (!this.active) {
      nervoVago.emit("multimodal.error", {
        correlationId: data.correlationId,
        message: "Entrada multimodal inativa.",
      });
      return;
    }

    const inputs = this.pendingInputs.get(data.correlationId) ?? [];
    inputs.push(data);
    this.pendingInputs.set(data.correlationId, inputs);

    hortaCore.set(
      `multimodal.pending.${data.correlationId}`,
      inputs.map((input) => ({ ...input })),
    );

    const uniqueTypes = new Set(inputs.map((input) => input.type));
    if (uniqueTypes.size >= 2) this.synchronize(data.correlationId, inputs);
  }

  flush(): void {
    for (const [correlationId, inputs] of this.pendingInputs) {
      this.synchronize(correlationId, inputs);
    }
  }

  private synchronize(correlationId: string, inputs: MultimodalInput[]): void {
    nervoVago.emit("multimodal.synchronized", {
      correlationId,
      inputs: inputs.map((input) => ({ ...input })),
      types: [...new Set(inputs.map((input) => input.type))],
      timestamp: Date.now(),
    });
    this.pendingInputs.delete(correlationId);
    hortaCore.set(`multimodal.pending.${correlationId}`, []);
  }
}

export const multimodalInputModule = new MultimodalInputModule();
