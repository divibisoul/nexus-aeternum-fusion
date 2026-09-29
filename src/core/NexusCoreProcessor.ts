import type { NexusPilotPort, NexusPilotRequest, NexusPilotResponse } from './NexusPilotPort';
import { analyzeEmotion, synthesizeSpeech, transcribeAudio } from '../mesh/GeminiAudioAdapter';

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
export type NexusCapabilityHandler = (input: unknown, context?: Record<string, unknown>) => Promise<unknown>;

export class NexusCoreProcessor {
  private pilot?: NexusPilotPort;
  private readonly capabilities = new Set<NexusCoreCapability>(DEFAULT_CAPABILITIES);
  private readonly handlers = new Map<NexusCoreCapability, NexusCapabilityHandler>();

  constructor() {
    this.registerHandler('voice-input', async input => {
      const request = this.requireRecord(input, 'voice-input');
      return transcribeAudio(
        this.requireString(request, 'audioBase64'),
        this.requireString(request, 'mimeType'),
      );
    });
    this.registerHandler('voice-output', async input => {
      const request = this.requireRecord(input, 'voice-output');
      return synthesizeSpeech(
        this.requireString(request, 'text'),
        typeof request.voice === 'string' && request.voice.trim() ? request.voice : 'Kore',
      );
    });
    this.registerHandler('emotion-analysis', async input => {
      const request = this.requireRecord(input, 'emotion-analysis');
      return analyzeEmotion(
        this.requireString(request, 'audioBase64'),
        this.requireString(request, 'mimeType'),
      );
    });
    this.registerHandler('speech-processing', async input => {
      const request = this.requireRecord(input, 'speech-processing');
      const transcript = await transcribeAudio(
        this.requireString(request, 'audioBase64'),
        this.requireString(request, 'mimeType'),
      );
      const emotion = await analyzeEmotion(
        this.requireString(request, 'audioBase64'),
        this.requireString(request, 'mimeType'),
      );
      return { transcript, emotion };
    });
  }

  registerHandler(capability: NexusCoreCapability, handler: NexusCapabilityHandler): void {
    if (!this.hasCapability(capability)) {
      throw new Error(`Cannot register handler for undeclared Nexus capability: ${capability}`);
    }
    if (this.handlers.has(capability)) {
      throw new Error(`NEXUS_CAPABILITY_HANDLER_ALREADY_REGISTERED:${capability}`);
    }
    this.handlers.set(capability, handler);
  }

  clearHandler(capability: NexusCoreCapability): void {
    this.handlers.delete(capability);
  }

  registeredCapabilities(): NexusCoreCapability[] {
    return [...this.handlers.keys()];
  }

  private requireRecord(input: unknown, capability: NexusCoreCapability): Record<string, unknown> {
    if (!input || typeof input !== 'object') {
      throw new TypeError(`NEXUS_${capability.toUpperCase()}_PAYLOAD_REQUIRED`);
    }
    return input as Record<string, unknown>;
  }

  private requireString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(`NEXUS_INPUT_${key.toUpperCase()}_REQUIRED`);
    }
    return value;
  }

  setPilot(pilot: NexusPilotPort): void {
    this.pilot = pilot;
  }

  clearPilot(): void {
    this.pilot = undefined;
  }

  getCapabilities(): NexusCoreCapability[] {
    return [...this.capabilities];
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

    const handler = this.handlers.get(request.capability);
    if (!handler) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: {
          code: 'CAPABILITY_HANDLER_NOT_BOUND',
          message: `Nexus capability ${request.capability} is declared but has no executable handler.`,
        },
      };
    }

    try {
      const output = await handler(request.input, request.context);
      return {
        id: request.id,
        capability: request.capability,
        success: true,
        output,
      };
    } catch (error) {
      return {
        id: request.id,
        capability: request.capability,
        success: false,
        error: {
          code: 'CAPABILITY_EXECUTION_FAILED',
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
