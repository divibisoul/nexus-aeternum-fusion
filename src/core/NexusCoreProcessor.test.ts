import { NexusCoreProcessor } from './NexusCoreProcessor';

describe('NexusCoreProcessor executable capability boundary', () => {
  it('does not report success for an unbound capability', async () => {
    const processor = new NexusCoreProcessor();
    const result = await processor.process({
      id: 'test-unbound',
      capability: 'spiritual-wisdom',
      input: { query: 'test' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CAPABILITY_HANDLER_NOT_BOUND');
  });

  it('rejects handler registration for an undeclared capability', () => {
    const processor = new NexusCoreProcessor();

    expect(() =>
      processor.registerHandler('not-declared' as never, async () => null),
    ).toThrow(/undeclared Nexus capability/);
  });

  it('keeps only explicitly bound handlers executable', () => {
    const processor = new NexusCoreProcessor();
    const registered = processor.registeredCapabilities();

    expect(registered).toContain('voice-input');
    expect(registered).toContain('voice-output');
    expect(registered).toContain('speech-processing');
    expect(registered).toContain('emotion-analysis');
    expect(registered).not.toContain('spiritual-wisdom');
  });
});
