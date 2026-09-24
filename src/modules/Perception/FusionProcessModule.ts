import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export type FusionSource = {
  id: string;
  payload: unknown;
  timestamp?: number;
};

export class FusionProcessModule {
  readonly id = "fusion-process";
  private active = false;

  constructor() {
    wormhole.register(this.id, this, {
      type: "engine",
      version: "1.0.0",
      capabilities: ["data-fusion", "conflict-detection", "unified-view"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("fusion.activate", () => this.activate());
    nervoVago.on("fusion.deactivate", () => this.deactivate());
    nervoVago.on("fusion.process", (data) => void this.fuse(data as { sources: FusionSource[]; correlationId?: string }));
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

  async fuse(data: { sources: FusionSource[]; correlationId?: string }): Promise<void> {
    if (!this.active) return;

    const sources = Array.isArray(data.sources) ? data.sources : [];
    const conflicts: Array<{ field: string; sourceIds: string[] }> = [];
    const primitiveByField = new Map<string, Array<{ id: string; value: unknown }>>();

    for (const source of sources) {
      if (!source || typeof source.payload !== "object" || source.payload === null) continue;
      for (const [field, value] of Object.entries(source.payload as Record<string, unknown>)) {
        if (value === null || value === undefined) continue;
        const values = primitiveByField.get(field) ?? [];
        values.push({ id: source.id, value });
        primitiveByField.set(field, values);
      }
    }

    for (const [field, values] of primitiveByField) {
      const signatures = new Set(values.map((item) => this.stableSignature(item.value)));
      if (signatures.size > 1) {
        conflicts.push({ field, sourceIds: values.map((item) => item.id) });
      }
    }

    const unified: Record<string, unknown> = {};
    for (const [field, values] of primitiveByField) {
      const distinct = values.filter(
        (value, index) =>
          values.findIndex((item) => this.stableSignature(item.value) === this.stableSignature(value.value)) === index,
      );
      unified[field] = distinct.length === 1 ? distinct[0].value : distinct.map((item) => item.value);
    }

    const result = {
      correlationId: data.correlationId,
      sources: sources.map((source) => ({ ...source })),
      unified,
      conflicts,
      timestamp: Date.now(),
    };

    hortaCore.set("fusion.last", result);
    nervoVago.emit("fusion.result", result);
  }

  private stableSignature(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

export const fusionProcessModule = new FusionProcessModule();
