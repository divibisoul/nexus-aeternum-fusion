import { sendFromN03, type N03Peer } from './N03PeerAdapter';

export type N03ExternalCapabilityRequest = {
  capability: string;
  payload?: unknown;
  correlationId: string;
  workloads?: unknown[];
  candidate?: Record<string, unknown>;
  strategy?: string;
};

/**
 * N03 keeps audio/speech ownership locally. External reasoning/tool capabilities
 * are executed by the canonical N02 handler through the existing Mesh. The
 * N07 orbital/Prefrontal preflight is requested by metadata and is fail-closed
 * when N07 is unavailable.
 */
export async function delegateN03ExternalCapability(
  request: N03ExternalCapabilityRequest,
): Promise<unknown> {
  const capability = request.capability.trim();
  if (!capability) throw new Error('N03_EXTERNAL_CAPABILITY_REQUIRED');
  const correlationId = request.correlationId.trim();
  if (!correlationId) throw new Error('N03_EXTERNAL_CORRELATION_REQUIRED');

  return sendFromN03(
    'N02' as N03Peer,
    capability,
    {
      payload: request.payload ?? {},
      metadata: {
        prefrontal_orbital: 'true',
        workloads_json: JSON.stringify(request.workloads ?? []),
        candidate_json: JSON.stringify(request.candidate ?? { capability }),
        strategy: request.strategy ?? 'n03-external-tool-preflight',
      },
    },
    30000,
    correlationId,
  );
}
