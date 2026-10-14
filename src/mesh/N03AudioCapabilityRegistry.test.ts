import { test } from 'bun:test';
import { N03_AUDIO_CAPABILITIES, hasAudioCapability } from './N03AudioCapabilityRegistry';

test('N03 exposes only implemented audio capabilities as executable', () => {
  const implemented = N03_AUDIO_CAPABILITIES.filter(capability => capability.status === 'implemented').map(capability => capability.id);
  const adapterRequired = N03_AUDIO_CAPABILITIES.filter(capability => capability.status === 'adapter-required').map(capability => capability.id);

  if (implemented.length !== 7) throw new Error(`expected 7 implemented audio capabilities, got ${implemented.length}`);
  if (adapterRequired.length !== 4) throw new Error(`expected 4 adapter-required audio capabilities, got ${adapterRequired.length}`);
  if (new Set([...implemented, ...adapterRequired]).size !== N03_AUDIO_CAPABILITIES.length) {
    throw new Error('audio capability IDs must be unique');
  }
  for (const capability of implemented) {
    if (!hasAudioCapability(capability)) throw new Error(`missing capability: ${capability}`);
  }
});
