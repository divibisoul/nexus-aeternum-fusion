import { N03_AUDIO_CAPABILITIES } from "../mesh/N03AudioCapabilityRegistry";

export type PerceptionExecutor = (
  capability: string,
  payload: unknown,
) => Promise<unknown>;

export interface PerceptionEvent {
  type: string;
  payload: unknown;
  correlationId?: string;
}

export interface PerceptionResult {
  status: "completed" | "handler_not_bound" | "adapter_required" | "unsupported";
  capability: string;
  correlationId?: string;
  result?: unknown;
}

export class PerceptionModule {
  readonly id = "M5_PERCEPTION";
  private active = true;

  constructor(private readonly executor?: PerceptionExecutor) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  capabilities() {
    return N03_AUDIO_CAPABILITIES.map(item => ({ ...item }));
  }

  async handle(event: PerceptionEvent): Promise<PerceptionResult> {
    if (!this.active) {
      throw new Error("M5_PERCEPTION is inactive");
    }

    const capability = event.type.startsWith("perception.")
      ? event.type.slice("perception.".length)
      : event.type;

    const descriptor = N03_AUDIO_CAPABILITIES.find(
      item => item.id === capability,
    );

    if (!descriptor) {
      return {
        status: "unsupported",
        capability,
        correlationId: event.correlationId,
      };
    }

    if (!this.executor) {
      return {
        status:
          descriptor.status === "implemented"
            ? "handler_not_bound"
            : "adapter_required",
        capability,
        correlationId: event.correlationId,
      };
    }

    const result = await this.executor(capability, event.payload);
    return {
      status: "completed",
      capability,
      correlationId: event.correlationId,
      result,
    };
  }
}
