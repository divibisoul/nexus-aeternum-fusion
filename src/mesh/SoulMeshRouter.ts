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
    const agent = createSoulMeshAgent(`N03.${capability}.agent`, [capability], handler);
    this.agents.register(agent);
    this.handlers.set(capability, handler);
  }

  /**
   * Explicit override boundary for canonical runtime upgrades. Existing agent
   * implementations are archived by the registry before the active handler is
   * changed; ordinary register() still rejects duplicate IDs.
   */
  registerPreservingPrevious(capability: string, handler: Handler) {
    const agent = createSoulMeshAgent(`N03.${capability}.agent`, [capability], handler);
    this.agents.preserveAndReplace(agent);
    this.handlers.set(capability, handler);
  }

  listPreservedAgents() {
    return this.agents.listPreservedVersions().map(agent => ({
      id: agent.id,
      nucleus: agent.nucleus,
      capabilities: [...agent.capabilities],
    }));
  }

  async dispatch(message: SoulMeshMessage) {
    if (!this.handlers.has(message.capability)) {
      throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${message.capability}`);
    }
    return this.agents.execute(message);
  }

  /**
   * Creates an outbound Mesh request while preserving an upstream
   * correlation ID when one exists. This keeps multi-hop IA↔IA traces intact.
   */
  request(
    source: SoulMeshMessage['source'],
    target: SoulMeshMessage['target'],
    capability: string,
    payload: unknown,
    correlationId?: string,
  ) {
    return createMessage({
      source,
      target,
      kind: 'request',
      capability,
      payload,
      correlationId: correlationId ?? crypto.randomUUID(),
    });
  }

  listAgents() {
    return this.agents.list().map(agent => ({ id: agent.id, nucleus: agent.nucleus, capabilities: agent.capabilities }));
  }
}
