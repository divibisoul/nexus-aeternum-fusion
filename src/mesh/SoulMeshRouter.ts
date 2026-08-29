import { createMessage, type SoulMeshMessage } from './SoulMeshProtocol';
import { createSoulMeshAgent } from './SoulMeshAgentContract';
import { SoulMeshAgentRegistry } from './SoulMeshAgentRegistry';

export type Handler = (message: SoulMeshMessage) => Promise<unknown> | unknown;

/**
 * N03 is an independent AI nucleus. Existing handlers remain the execution
 * source; the agent registry adds the explicit agent layer without replacing
 * the existing Mesh router.
 */
export class SoulMeshRouter {
  private handlers = new Map<string, Handler>();
  readonly agents = new SoulMeshAgentRegistry();

  register(capability: string, handler: Handler) {
    this.handlers.set(capability, handler);
    this.agents.register(createSoulMeshAgent(`N03.${capability}.agent`, [capability], handler));
  }

  async dispatch(message: SoulMeshMessage) {
    if (!this.handlers.has(message.capability)) {
      throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${message.capability}`);
    }
    return this.agents.execute(message);
  }

  request(source: SoulMeshMessage['source'], target: SoulMeshMessage['target'], capability: string, payload: unknown) {
    return createMessage({ source, target, kind: 'request', capability, payload, correlationId: crypto.randomUUID() });
  }

  listAgents() {
    return this.agents.list().map(agent => ({ id: agent.id, nucleus: agent.nucleus, capabilities: agent.capabilities }));
  }
}
