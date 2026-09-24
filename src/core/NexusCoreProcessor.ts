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
  'voice-input',
  'voice-output',
  'speech-processing',
  'multimodal-input',
  'cognitive-ui',
  'emotion-analysis',
  'spiritual-wisdom',
  'plant-knowledge',
  'ritual-knowledge',
  'frequency-context',
  'mesh-communication',
];

/**
 * Nucleus 03 processor.
 *
 * This is deliberately an orchestration layer rather than a replacement for
 * the existing SoulInterface, voice functions, spiritual-wisdom knowledge,
 * or Soul Mesh transport. Existing capabilities remain available and are
 * exposed through one processor contract so the six-nucleus APK can call
 * this nucleus as a single computational unit.
 */
export class NexusCoreProcessor {
  private pilot?: NexusPilotPort;
  private readonly capabilities = new Set<NexusCoreCapability>(DEFAULT_CAPABILITIES);
  private readonly executors = new Map<NexusCoreCapability, (request: NexusCoreRequest) => Promise<unknown> | unknown>();

  setPilot(pilot: NexusPilotPort): void {
    this.pilot = pilot;
  }

  clearPilot(): void {
    this.pilot = undefined;
  }

  getCapabilities(): NexusCoreCapability[] {
    return [...this.capabilities];
  }

  registerExecutor(
    capability: NexusCoreCapability,
    executor: (request: NexusCoreRequest) => Promise<unknown> | unknown,
  ): void {
    if (!this.capabilities.has(capability)) throw new Error('CAPABILITY_NOT_REGISTERED:' + capability);
    this.executors.set(capability, executor);
  }

  clearExecutor(capability: NexusCoreCapability): void {
    this.executors.delete(capability);
  }

  hasCapability(capability: string): capability is NexusCoreCapability {
    return this.capabilities.has(capability as NexusCoreCapability);
  }

  async process(request: NexusCoreRequest): Promise<NexusCoreResult> {
    if (!this.hasCapability(request.capability)) {
      return { id: request.id, capability: request.capability, success: false, error: { code: 'CAPABILITY_UNAVAILABLE', message: `Capability ${request.capability} is not registered.` } };
    }

    if (this.isPilotTask(request)) {
      return this.forwardToPilot(request);
    }

    const executor = this.executors.get(request.capability);
    if (!executor) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: {
          code: 'EXECUTOR_NOT_BOUND',
          message: 'Capability ' + request.capability + ' is declared but has no executable runtime bound in NexusCoreProcessor.',
        },
      };
    }

    try {
      return {
        id: request.id,
        capability: request.capability,
        success: true,
        output: await executor(request),
      };
    } catch (error) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: {
          code: 'EXECUTOR_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
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