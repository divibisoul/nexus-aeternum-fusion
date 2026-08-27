import type { NexusPilotPort, NexusPilotRequest, NexusPilotResponse } from './NexusPilotPort';

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

const DEFAULT_CAPABILITIES: readonly NexusCoreCapability[] = [
  'voice-input', 'voice-output', 'speech-processing', 'multimodal-input',
  'cognitive-ui', 'emotion-analysis', 'spiritual-wisdom', 'plant-knowledge',
  'ritual-knowledge', 'frequency-context', 'mesh-communication',
];

const PILOT_CAPABILITIES = new Set<NexusCoreCapability>([
  'voice-input', 'voice-output', 'speech-processing', 'multimodal-input',
  'cognitive-ui', 'emotion-analysis', 'spiritual-wisdom', 'plant-knowledge',
  'ritual-knowledge', 'frequency-context',
]);

/**
 * N03 computational gateway. It never fabricates successful capability results:
 * every non-Mesh capability is executed by the connected provider-agnostic pilot.
 */
export class NexusCoreProcessor {
  private pilot?: NexusPilotPort;
  private readonly capabilities = new Set<NexusCoreCapability>(DEFAULT_CAPABILITIES);

  setPilot(pilot: NexusPilotPort): void { this.pilot = pilot; }
  clearPilot(): void { this.pilot = undefined; }
  getCapabilities(): NexusCoreCapability[] { return [...this.capabilities]; }
  hasCapability(capability: string): capability is NexusCoreCapability { return this.capabilities.has(capability as NexusCoreCapability); }
  isExecutable(capability: NexusCoreCapability): boolean { return capability === 'mesh-communication' || (PILOT_CAPABILITIES.has(capability) && !!this.pilot); }

  async process(request: NexusCoreRequest): Promise<NexusCoreResult> {
    if (!this.hasCapability(request.capability)) {
      return { id: request.id, capability: request.capability, success: false, error: { code: 'CAPABILITY_UNAVAILABLE', message: `Capability ${request.capability} is not registered.` } };
    }

    if (request.capability === 'mesh-communication') {
      return {
        id: request.id, capability: request.capability, success: true,
        output: { nucleus: 'N03', protocol: 'soul-mesh/1', mode: 'transport-owned', ready: true },
      };
    }

    if (!PILOT_CAPABILITIES.has(request.capability)) {
      return { id: request.id, capability: request.capability, success: false, error: { code: 'CAPABILITY_EXECUTOR_UNAVAILABLE', message: `No executor is registered for ${request.capability}.` } };
    }

    return this.forwardToPilot(request);
  }

  private async forwardToPilot(request: NexusCoreRequest): Promise<NexusCoreResult> {
    if (!this.pilot) {
      return { id: request.id, capability: request.capability, success: false, error: { code: 'PILOT_NOT_CONNECTED', message: `Capability ${request.capability} requires the configured Nexus pilot.` } };
    }
    const pilotRequest: NexusPilotRequest = { requestId: request.id, input: request.input, context: request.context };
    try {
      const response: NexusPilotResponse = await this.pilot.request(pilotRequest);
      return { id: request.id, capability: request.capability, success: true, output: response };
    } catch (error) {
      return { id: request.id, capability: request.capability, success: false, error: { code: 'PILOT_REQUEST_FAILED', message: error instanceof Error ? error.message : String(error) } };
    }
  }
}

export const nexusCoreProcessor = new NexusCoreProcessor();
