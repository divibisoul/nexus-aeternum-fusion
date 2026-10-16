import assert from 'node:assert/strict';
import test from 'node:test';
import { createSoulMeshAgent } from './SoulMeshAgentContract';
import { SoulMeshAgentRegistry } from './SoulMeshAgentRegistry';
import { createMessage } from './SoulMeshProtocol';

test('explicit agent replacement archives prior behavior and activates the new handler', async () => {
  const registry = new SoulMeshAgentRegistry();
  const legacy = createSoulMeshAgent(
    'N03.audio.transcribe.agent',
    ['audio.transcribe'],
    () => ({ provider: 'legacy-gemini-handler' }),
  );
  const canonical = createSoulMeshAgent(
    'N03.audio.transcribe.agent',
    ['audio.transcribe'],
    () => ({ provider: 'canonical-runtime' }),
  );

  registry.register(legacy);
  registry.preserveAndReplace(canonical);

  assert.equal(registry.list().length, 1);
  assert.equal(registry.list()[0], canonical);
  assert.deepEqual(registry.listPreservedVersions(), [legacy]);

  const response = await registry.execute(createMessage({
    source: 'N01',
    target: 'N03',
    kind: 'request',
    capability: 'audio.transcribe',
    payload: { data: 'c2FtcGxl', mimeType: 'audio/wav' },
  }));
  assert.deepEqual(response, { provider: 'canonical-runtime' });
});

test('ordinary duplicate registration still fails instead of silently overwriting an agent', () => {
  const registry = new SoulMeshAgentRegistry();
  const first = createSoulMeshAgent('N03.audio.transcribe.agent', ['audio.transcribe'], () => 'first');
  const second = createSoulMeshAgent('N03.audio.transcribe.agent', ['audio.transcribe'], () => 'second');
  registry.register(first);
  assert.throws(() => registry.register(second), /AGENT_ALREADY_REGISTERED/);
  assert.equal(registry.list()[0], first);
  assert.deepEqual(registry.listPreservedVersions(), []);
});

test('preserving replacement rejects identity or capability changes without changing active state', () => {
  const registry = new SoulMeshAgentRegistry();
  const current = createSoulMeshAgent('N03.audio.transcribe.agent', ['audio.transcribe'], () => 'current');
  const incompatible = createSoulMeshAgent('N03.audio.transcribe.agent', ['audio.transform'], () => 'incompatible');
  registry.register(current);
  assert.throws(() => registry.preserveAndReplace(incompatible), /AGENT_OVERRIDE_IDENTITY_MISMATCH/);
  assert.equal(registry.list()[0], current);
  assert.deepEqual(registry.listPreservedVersions(), []);
});
