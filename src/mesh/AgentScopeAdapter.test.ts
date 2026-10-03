import { test, expect } from 'bun:test';
import { describeAgentScopeAdapter, isAgentScopeExecutable, runAgentScopePerception } from './AgentScopeAdapter';

test('AgentScope adapter preserves configured/source truth', () => {
  delete process.env.SOUL_N03_AGENTSCOPE_ENABLED;
  expect(describeAgentScopeAdapter().state).toBe('DEGRADED');
  expect(isAgentScopeExecutable()).toBe(false);
});

test('AgentScope adapter is fail-closed when runtime is not configured', async () => {
  const result = await runAgentScopePerception({ text: 'test' });
  expect(['DEGRADED','FAIL']).toContain(result.state);
});
