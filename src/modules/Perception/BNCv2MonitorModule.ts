import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export type ProcessorState = {
  id: string;
  state: unknown;
  updatedAt?: number;
  source?: string;
};

export class BNCv2MonitorModule {
  readonly id = "bncv2-monitor";
  private active = false;
  private readonly processors = new Map<string, ProcessorState>();

  constructor() {
    wormhole.register(this.id, this, {
      type: "monitor",
      version: "1.0.0",
      capabilities: ["bio-neural-monitoring", "processor-tracking"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("bncv2.activate", () => this.activate());
    nervoVago.on("bncv2.deactivate", () => this.deactivate());
    nervoVago.on("bncv2.processor.update", (data) => this.updateProcessor(data as ProcessorState));
  }

  activate(): void {
    this.active = true;
    hortaCore.set(`${this.id}.active`, true);
    nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    hortaCore.set(`${this.id}.active`, false);
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  updateProcessor(data: ProcessorState): void {
    if (!this.active) return;

    if (!data?.id) {
      nervoVago.emit("bncv2.error", { message: "processor id is required" });
      return;
    }

    const state = {
      ...data,
      updatedAt: data.updatedAt ?? Date.now(),
    };

    this.processors.set(data.id, state);
    hortaCore.set(`bncv2.processor.${data.id}`, state);
    nervoVago.emit("bncv2.processor.observed", state);
  }

  getProcessors(): ProcessorState[] {
    return [...this.processors.values()].map((state) => ({ ...state }));
  }
}

export const bncv2MonitorModule = new BNCv2MonitorModule();
