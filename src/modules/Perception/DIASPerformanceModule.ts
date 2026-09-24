import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

type FrameSample = { timestamp: number; fps: number };

export class DIASPerformanceModule {
  readonly id = "dias-performance";
  private active = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private frameHandle: number | null = null;
  private lastFrame = 0;
  private frameCount = 0;
  private fps = 0;
  private latency = 0;

  constructor() {
    wormhole.register(this.id, this, {
      type: "monitor",
      version: "1.0.0",
      capabilities: ["performance-monitoring", "fps-tracking", "memory-observation"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("dias.activate", () => this.activate());
    nervoVago.on("dias.deactivate", () => this.deactivate());
    nervoVago.on("performance.report", (data) =>
      this.reportMetrics(data as { fps?: number; latency?: number }),
    );
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    hortaCore.set(`${this.id}.active`, true);
    nervoVago.emit("module.activated", { module: this.id });
    this.startMonitoring();
  }

  deactivate(): void {
    this.active = false;
    hortaCore.set(`${this.id}.active`, false);
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.frameHandle !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.frameHandle);
    }
    this.intervalId = null;
    this.frameHandle = null;
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  reportMetrics(metrics: { fps?: number; latency?: number }): void {
    if (typeof metrics.fps === "number" && Number.isFinite(metrics.fps)) this.fps = metrics.fps;
    if (typeof metrics.latency === "number" && Number.isFinite(metrics.latency)) this.latency = metrics.latency;
    if (this.fps > 0 && this.fps < 30) {
      nervoVago.emit("performance.degraded", {
        fps: this.fps,
        action: "reduce_complexity",
      });
    }
  }

  getSnapshot() {
    return {
      fps: this.fps,
      latency: this.latency,
      memory: this.readMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  private startMonitoring(): void {
    if (typeof requestAnimationFrame === "function") {
      const tick = (timestamp: number) => {
        if (!this.active) return;
        if (this.lastFrame) {
          const delta = timestamp - this.lastFrame;
          if (delta > 0) {
            this.frameCount += 1;
            this.fps = 1000 / delta;
          }
        }
        this.lastFrame = timestamp;
        this.frameHandle = requestAnimationFrame(tick);
      };
      this.frameHandle = requestAnimationFrame(tick);
    }

    this.intervalId = setInterval(() => {
      if (!this.active) return;
      const snapshot = this.getSnapshot();
      hortaCore.set("performance.metrics", snapshot);
      nervoVago.emit("performance.update", snapshot);
      const sample: FrameSample = { timestamp: snapshot.timestamp, fps: this.frameCount ? this.fps : 0 };
      hortaCore.set("performance.lastFrameSample", sample);
      this.frameCount = 0;
    }, 1000);
  }

  private readMemoryUsage(): number | null {
    const memory = (performance as Performance & {
      memory?: { usedJSHeapSize?: number };
    }).memory;
    return typeof memory?.usedJSHeapSize === "number" ? memory.usedJSHeapSize : null;
  }
}

export const diasPerformanceModule = new DIASPerformanceModule();
