/**
 * N03 pair-fusion contract.
 *
 * This module intentionally contains no second transport and no duplicate
 * router. It describes the multiplicative capability model used when N03
 * works with adjacent nuclei.
 */
export type FusionCapability = {
  nucleus: 'N02' | 'N03' | 'N04';
  agents: readonly string[];
  tools: readonly string[];
  capabilities: readonly string[];
  context?: readonly string[];
  execution?: readonly string[];
};

export type PairFusion = {
  source: FusionCapability;
  target: FusionCapability;
  shared: readonly string[];
  emergent: readonly string[];
  score: number;
  dimensions: {
    agents: number;
    tools: number;
    capabilities: number;
    context: number;
    execution: number;
  };
};

const overlap = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => b.includes(value));

const unique = (values: readonly string[]) => [...new Set(values)];

/**
 * Calculates a deterministic synergy signal from real inventories.
 *
 * Important: agents, tools, capabilities, context and execution are kept as
 * separate dimensions. We must not collapse them into one string set because
 * an agent id and a capability id can legitimately have the same name.
 *
 * The multiplicative component is intentionally used as a discovery signal,
 * not as proof that an emergent function is executable. Executability still
 * requires a concrete composition path and handlers.
 */
export function calculatePairFusion(source: FusionCapability, target: FusionCapability): PairFusion {
  const shared = unique([
    ...overlap(source.agents, target.agents),
    ...overlap(source.tools, target.tools),
    ...overlap(source.capabilities, target.capabilities),
    ...overlap(source.context ?? [], target.context ?? []),
    ...overlap(source.execution ?? [], target.execution ?? []),
  ]);

  const sourceValues = [
    ...source.agents,
    ...source.tools,
    ...source.capabilities,
    ...(source.context ?? []),
    ...(source.execution ?? []),
  ];
  const targetValues = [
    ...target.agents,
    ...target.tools,
    ...target.capabilities,
    ...(target.context ?? []),
    ...(target.execution ?? []),
  ];

  const sourceSet = new Set(sourceValues);
  const targetSet = new Set(targetValues);
  const complementary = sourceValues.filter((x) => !targetSet.has(x));
  const targetComplementary = targetValues.filter((x) => !sourceSet.has(x));
  const emergent = unique([...complementary, ...targetComplementary]);

  const dimensions = {
    agents: source.agents.length * target.agents.length,
    tools: source.tools.length * target.tools.length,
    capabilities: source.capabilities.length * target.capabilities.length,
    context: (source.context?.length ?? 0) * (target.context?.length ?? 0),
    execution: (source.execution?.length ?? 0) * (target.execution?.length ?? 0),
  };

  // Product over available dimensions avoids pretending that an unknown
  // dimension is an empty inventory. At least one dimension is always present.
  const availableProducts = Object.values(dimensions).filter((value) => value > 0);
  const multiplicativeSignal = availableProducts.reduce((product, value) => product * value, 1);
  const score = multiplicativeSignal + emergent.length - shared.length;

  return { source, target, shared, emergent, score, dimensions };
}

/**
 * Two simultaneous pair analyses can be combined before the next engineering
 * level. This is the structural 2+2 -> 4 nucleus stage; runtime execution is
 * delegated to the existing Soul Mesh transports.
 */
export function fuseTwoPairs(left: PairFusion, right: PairFusion) {
  const emergent = unique([...left.emergent, ...right.emergent]);
  const score = left.score * right.score;
  return {
    nuclei: [left.source.nucleus, left.target.nucleus, right.source.nucleus, right.target.nucleus] as const,
    emergent,
    score,
    nextLevel: score > 0 ? 'FOUR_NUCLEUS_FUSION_READY' as const : 'REQUIRES_COMPATIBILITY_WORK' as const,
  };
}
