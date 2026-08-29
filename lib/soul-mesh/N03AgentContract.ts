import type { SoulMeshMessage } from './SoulMeshProtocol';

export type N03Agent = {
  id: string;
  name: string;
  capabilities: string[];
  execute: (message: SoulMeshMessage) => Promise<unknown> | unknown;
};
