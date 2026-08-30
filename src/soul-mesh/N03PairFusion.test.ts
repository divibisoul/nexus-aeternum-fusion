import { calculatePairFusion, fuseTwoPairs, type FusionCapability } from './N03PairFusion';

describe('N03 pair fusion', () => {
  const n02: FusionCapability = {
    nucleus: 'N02',
    agents: ['cognitive-agent'],
    tools: ['multimodal-tool'],
    capabilities: ['cognitive-processing', 'ai.generate', 'ai.multimodal'],
    context: ['conversation'],
    execution: ['in-process'],
  };

  const n03: FusionCapability = {
    nucleus: 'N03',
    agents: ['audio-agent'],
    tools: ['transcription-tool', 'speech-tool'],
    capabilities: ['audio.transcribe', 'audio.analyze.emotion', 'speech.synthesize'],
    context: ['audio'],
    execution: ['async'],
  };

  it('keeps synergy dimensions separate and calculates multiplicative signals', () => {
    const fusion = calculatePairFusion(n02, n03);
    expect(fusion.dimensions.agents).toBe(1);
    expect(fusion.dimensions.tools).toBe(2);
    expect(fusion.dimensions.capabilities).toBe(9);
    expect(fusion.dimensions.context).toBe(1);
    expect(fusion.dimensions.execution).toBe(1);
    expect(fusion.emergent).toContain('ai.multimodal');
    expect(fusion.emergent).toContain('audio.transcribe');
    expect(fusion.score).toBeGreaterThan(0);
  });

  it('does not confuse equal identifiers across dimensions', () => {
    const source: FusionCapability = {
      nucleus: 'N02',
      agents: ['shared'],
      tools: [],
      capabilities: [],
    };
    const target: FusionCapability = {
      nucleus: 'N03',
      agents: [],
      tools: ['shared'],
      capabilities: [],
    };
    const fusion = calculatePairFusion(source, target);
    expect(fusion.shared).toEqual([]);
    expect(fusion.emergent).toEqual(['shared']);
  });

  it('composes two pair results for the four-nucleus stage', () => {
    const left = calculatePairFusion(n02, n03);
    const right = calculatePairFusion({ ...n03, nucleus: 'N04' }, n02);
    const four = fuseTwoPairs(left, right);
    expect(four.nuclei).toEqual(['N02', 'N03', 'N04', 'N02']);
    expect(four.score).toBe(left.score * right.score);
    expect(four.nextLevel).toBe('FOUR_NUCLEUS_FUSION_READY');
  });
});
