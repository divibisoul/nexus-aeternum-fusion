import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../api/soul-mesh.ts', import.meta.url), 'utf8');
const audioRegistry = await readFile(new URL('../src/mesh/N03AudioCapabilityRegistry.ts', import.meta.url), 'utf8');
const ownership = await readFile(new URL('../lib/soul-mesh/N03CapabilityOwnership.md', import.meta.url), 'utf8');

assert.match(api, /sara\.clareira\.audit/);
assert.match(api, /\/v1\/clareira\/audit/);
assert.match(api, /const isGet=.*sara\.clareira\.audit/);
assert.match(audioRegistry, /audio\.transcribe/);
assert.match(audioRegistry, /speech\.synthesize/);
assert.match(ownership, /N03 is the canonical owner/);

console.log('N03_CLAREIRA_SYMBIOSIS_CONTRACT: ok=true audit_consumer=true native_audio_registry=true ownership_preserved=true');
