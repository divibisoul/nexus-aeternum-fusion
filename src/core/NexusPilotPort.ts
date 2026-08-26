/**
 * Provider-agnostic cockpit port.
 *
 * The Nexus core never owns an AI provider API key and never calls a provider
 * directly. The UI/runtime supplies the user's authenticated AI pilot through
 * this port. This keeps Nexus as the cockpit and the external AI as the pilot.
 */
export type NexusPilotRequest = {
  requestId: string;
  input: unknown;
  context?: Record<string, unknown>;
};

export type NexusPilotResponse = {
  requestId: string;
  output: unknown;
  model?: string;
  provider?: string;
};

export interface NexusPilotPort {
  readonly id: string;
  readonly provider: string;
  request(request: NexusPilotRequest): Promise<NexusPilotResponse>;
  disconnect?(): Promise<void> | void;
}
