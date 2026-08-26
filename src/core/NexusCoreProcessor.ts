import type { NexusPilotPort, NexusPilotRequest, NexusPilotResponse } from './NexusPilotPort';
import { executeN03Capability, N03_CAPABILITIES } from '../soul-mesh/N03CapabilityBridge';

export type NexusCoreCapability =
  | 'voice-input'
  | 'voice-output'
  | 'speech-processing'
  | 'multimodal-input'
  | 'cognitive-ui'
  | 'emotion-analysis'
  | 'spiritual-wisdom'
  | 'plant-knowledge'
  | 'ritual-knowledge'
  | 'frequency-context'
  | 'mesh-communication';

export type NexusCoreRequest = {
  id: string;
  capability: NexusCoreCapability;
  input: unknown;
  context?: Record<string, unknown>;
};

export type NexusCoreResult = {
  id: string;
  capability: NexusCoreCapability;
  success: boolean;
  output?: unknown;
  error?: { code: string; message: string };
};

export type NexusCoreHandler = (request: NexusCoreRequest) => Promise<unknown> | unknown;

const DEFAULT_CAPABILITIES: readonly NexusCoreCapability[] = N03_CAPABILITIES;

/**
 * N03 computational core.
 *
 * The processor is the capability boundary between the N03 runtime and Soul
 * Mesh. A capability is not considered executable merely because it is named:
 * it must have a registered handler. The optional pilot remains available for
 * user-selected external AI providers, while the local N03 runtime is the
 * deterministic fallback for cognitive capabilities.
 */
export class NexusCoreProcessor {
  private pilot?: NexusPilotPort;
  private readonly capabilities = new Set<NexusCoreCapability>(DEFAULT_CAPABILITIES);
  private readonly handlers = new Map<NexusCoreCapability, NexusCoreHandler>();

  constructor() {
    for (const capability of DEFAULT_CAPABILITIES) {
      this.handlers.set(capability, (request) => executeN03Capability(capability, request));
    }
  }

  setPilot(pilot: NexusPilotPort): void {
    this.pilot = pilot;
  }

  clearPilot(): void {
    this.pilot = undefined;
  }

  registerHandler(capability: NexusCoreCapability, handler: NexusCoreHandler): void {
    this.handlers.set(capability, handler);
  }

  unregisterHandler(capability: NexusCoreCapability): void {
    this.handlers.delete(capability);
  }

  getCapabilities(): NexusCoreCapability[] {
    return [...this.capabilities];
  }

  getExecutableCapabilities(): NexusCoreCapability[] {
    return [...this.handlers.keys()];
  }

  hasCapability(capability: string): capability is NexusCoreCapability {
    return this.capabilities.has(capability as NexusCoreCapability);
  }

  isExecutable(capability: string): boolean {
    return this.hasCapability(capability) && this.handlers.has(capability);
  }

  async process(request: NexusCoreRequest): Promise<NexusCoreResult> {
    if (!this.hasCapability(request.capability)) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: { code: 'CAPABILITY_UNAVAILABLE', message: `Capability ${request.capability} is not registered.` },
      };
    }

    const handler = this.handlers.get(request.capability);
    if (!handler) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: { code: 'CAPABILITY_HANDLER_NOT_REGISTERED', message: `No executable handler is registered for ${request.capability}.` },
      };
    }

    if (this.isPilotTask(request) && this.pilot) {
      return this.forwardToPilot(request);
    }

    try {
      const output = await handler(request);
      return { id: request.id, capability: request.capability, success: true, output };
    } catch (error) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: { code: 'CAPABILITY_EXECUTION_ERROR', message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  private isPilotTask(request: NexusCoreRequest): boolean {
    return request.capability === 'cognitive-ui' || request.capability === 'multimodal-input';
  }

  private async forwardToPilot(request: NexusCoreRequest): Promise<NexusCoreResult> {
    if (!this.pilot) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: { code: 'PILOT_NOT_CONNECTED', message: 'No user-selected AI pilot is connected to Nexus.' },
      };
    }

    const pilotRequest: NexusPilotRequest = { requestId: request.id, input: request.input, context: request.context };
    try {
      const response: NexusPilotResponse = await this.pilot.request(pilotRequest);
      return { id: request.id, capability: request.capability, success: true, output: response };
    } catch (error) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: { code: 'PILOT_REQUEST_FAILED', message: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

export const nexusCoreProcessor = new NexusCoreProcessor();
