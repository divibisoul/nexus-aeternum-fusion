import { describe, expect, it } from 'bun:test';
import { NexusCoreProcessor } from './NexusCoreProcessor';

describe('NexusCoreProcessor', () => {
  it('does not report success for an unbound declared capability', async () => {
    const processor = new NexusCoreProcessor();
    const result = await processor.process({
      id: 'unbound-1',
      capability: 'spiritual-wisdom',
      input: { text: 'test' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EXECUTOR_NOT_BOUND');
  });

  it('executes only after an explicit executor is registered', async () => {
    const processor = new NexusCoreProcessor();
    processor.registerExecutor('spiritual-wisdom', async request => ({
      handled: true,
      input: request.input,
    }));

    const result = await processor.process({
      id: 'bound-1',
      capability: 'spiritual-wisdom',
      input: { text: 'test' },
    });

    expect(result.success).toBe(true);
    expect(result.output).toEqual({
      handled: true,
      input: { text: 'test' },
    });
  });
});