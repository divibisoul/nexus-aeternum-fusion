import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export type DCRSMetric = {
  name: string;
  value: number;
  min?: number;
  max?: number;
  timestamp?: number;
  source?: string;
};

export class DCRSMonitorModule {
  readonly id = "dcrs-monitor";
  private active = false;
  private readonly metrics: DCRSMetric[] = [];
  private anomalyBand = 0.5;

  constructor() {
    wormhole.register(this.id, this, {
      type: "monitor",
      version: "1.0.0",
      capabilities: ["coherence-monitoring", "real-time-metrics", "anomaly-detection"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    this.anomalyBand = hortaCore.get<number>(`${this.id}.anomalyBand`) ?? 0.5;
    nervoVago.on("dcrs.activate", () => this.activate());
    nervoVago.on("dcrs.deactivate", () => this.deactivate());
    nervoVago.on("dcrs.metric", (data) => this.recordMetric(data as DCRSMetric));
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

  recordMetric(data: DCRSMetric): void {
    if (!this.active) return;

    const metric = { ...data, timestamp: data.timestamp ?? Date.now() };
    this.metrics.push(metric);
    if (this.metrics.length > 100) this.metrics.shift();

    hortaCore.set("dcrs.metrics", this.metrics.map((item) => ({ ...item })));

    const hasRange = typeof metric.min === "number" && typeof metric.max === "number";
    const outOfRange = hasRange
      ? metric.value < metric.min! || metric.value > metric.max!
      : Math.abs(metric.value) > this.anomalyBand;

    if (outOfRange) {
      nervoVago.emit("dcrs.anomaly", {
        metric: metric.name,
        value: metric.value,
        severity: "high",
        reason: hasRange ? "outside_declared_range" : "outside_configured_absolute_band",
        timestamp: metric.timestamp,
      });
    }
  }

  setAnomalyBand(value: number): void {
    if (!Number.isFinite(value) || value <= 0) throw new Error("anomalyBand must be positive");
    this.anomalyBand = value;
    hortaCore.set(`${this.id}.anomalyBand`, value);
  }

  getMetrics(): DCRSMetric[] {
    return this.metrics.map((item) => ({ ...item }));
  }
}

export const dcrsMonitorModule = new DCRSMonitorModule();
