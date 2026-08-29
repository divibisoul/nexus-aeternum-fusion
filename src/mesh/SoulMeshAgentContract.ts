import type { SoulMeshMessage } from './SoulMeshProtocol';

export type SoulMeshAgent = {
  id: string;
  nucleus: 'N03';
  capabilities: string[];
  handle(message: SoulMeshMessage): Promise<unknown> | unknown;
};

export function createSoulMeshAgent(
  id: string,
  capabilities: string[],
  handler: (message: SoulMeshMessage) => Promise<unknown> | unknown,
): SoulMeshAgent {
  if (!id.trim()) throw new Error('AGENT_ID_REQUIRED');
  if (!capabilities.length) throw new Error('AGENT_CAPABILITIES_REQUIRED');
  return { id, nucleus: 'N03', capabilities: [...new Set(capabilities)], handle: handler };
}
