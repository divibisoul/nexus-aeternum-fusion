import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export type ProcessorDetailRequest = {
  processorId: string;
};

export type ProcessorMaintenanceRequest = {
  processorId: string;
  action: string;
};

export class ProcessorDetailModule {
  readonly id = "processor-detail";
  private active = false;
  private readonly maintenanceHandlers = new Map<string, (action: string) => Promise<unknown>>();

  constructor() {
    wormhole.register(this.id, this, {
      type: "service",
      version: "1.0.0",
      capabilities: ["processor-detail", "logs", "maintenance"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("processor.detail.activate", () => this.activate());
    nervoVago.on("processor.detail.deactivate", () => this.deactivate());
    nervoVago.on("processor.detail.request", (data) =>
      void this.getDetail(data as ProcessorDetailRequest),
    );
    nervoVago.on("processor.maintenance", (data) =>
      void this.maintenance(data as ProcessorMaintenanceRequest),
    );
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

  registerMaintenanceHandler(
    processorId: string,
    handler: (action: string) => Promise<unknown>,
  ): void {
    this.maintenanceHandlers.set(processorId, handler);
  }

  async getDetail(data: ProcessorDetailRequest): Promise<void> {
    if (!this.active) {
      nervoVago.emit("processor.detail.error", {
        processorId: data.processorId,
        message: "Processor detail module is inactive.",
      });
      return;
    }

    const observed = hortaCore.get<Record<string, unknown>>(
      `bncv2.processor.${data.processorId}`,
    );

    const detail = {
      id: data.processorId,
      status: observed ? "observed" : "unobserved",
      source: observed ? "bncv2-monitor" : "none",
      state: observed ?? null,
      timestamp: Date.now(),
    };

    hortaCore.set(`processor.detail.${data.processorId}`, detail);
    nervoVago.emit("processor.detail.result", detail);
  }

  async maintenance(data: ProcessorMaintenanceRequest): Promise<void> {
    if (!this.active) return;

    const handler = this.maintenanceHandlers.get(data.processorId);
    if (!handler) {
      nervoVago.emit("processor.maintenance.result", {
        processorId: data.processorId,
        action: data.action,
        status: "handler_not_bound",
        timestamp: Date.now(),
      });
      return;
    }

    try {
      const result = await handler(data.action);
      nervoVago.emit("processor.maintenance.result", {
        processorId: data.processorId,
        action: data.action,
        status: "completed",
        result,
        timestamp: Date.now(),
      });
    } catch (error) {
      nervoVago.emit("processor.maintenance.result", {
        processorId: data.processorId,
        action: data.action,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }
}

export const processorDetailModule = new ProcessorDetailModule();
