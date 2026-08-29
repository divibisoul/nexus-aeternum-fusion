/**
 * N03 pair-fusion contract.
 *
 * This module intentionally contains no second transport and no duplicate
 * router. It describes the multiplicative capability model used when N03
 * works with the adjacent N02 and N04 nuclei.
 */
export type FusionCapability = {
  nucleus: 'N02' | 'N03' | 'N04';
  agents: readonly string[];
  tools: readonly string[];
  capabilities: readonly string[];
};

export type PairFusion = {
  source: FusionCapability;
  target: FusionCapability;
  shared: readonly string[];
  emergent: readonly string[];
  score: number;
};

const overlap = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => b.includes(value));

/**
 * Calculates a deterministic synergy score from real declared capabilities.
 * Complementary functions increase the score; duplicated functions do not.
 */
export function calculatePairFusion(source: FusionCapability, target: FusionCapability): PairFusion {
  const shared = [
    ...overlap(source.agents, target.agents),
    ...overlap(source.tools, target.tools),
    ...overlap(source.capabilities, target.capabilities),
  ];

  const sourceSet = new Set([...source.agents, ...source.tools, ...source.capabilities]);
  const targetSet = new Set([...target.agents, ...target.tools, ...target.capabilities]);
  const complementary = [...sourceSet].filter((x) => !targetSet.has(x));
  const targetComplementary = [...targetSet].filter((x) => !sourceSet.has(x));
  const emergent = [...new Set([...complementary, ...targetComplementary])];

  const score = (sourceSet.size * targetSet.size) + emergent.length - shared.length;
  return { source, target, shared, emergent, score };
}

/**
 * Two simultaneous pair analyses can be combined before the next engineering
 * level. This is the structural 2+2 -> 4 nucleus stage; runtime execution is
 * intentionally delegated to the existing Soul Mesh transports.
 */
export function fuseTwoPairs(left: PairFusion, right: PairFusion) {
  const emergent = [...new Set([...left.emergent, ...right.emergent])];
  const score = left.score * right.score;
  return {
    nuclei: [left.source.nucleus, left.target.nucleus, right.source.nucleus, right.target.nucleus] as const,
    emergent,
    score,
    nextLevel: score > 0 ? 'FOUR_NUCLEUS_FUSION_READY' as const : 'REQUIRES_COMPATIBILITY_WORK' as const,
  };
}
