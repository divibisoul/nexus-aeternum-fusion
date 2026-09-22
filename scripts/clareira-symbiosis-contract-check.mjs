import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../api/soul-mesh.ts', import.meta.url), 'utf8');
const audioRegistry = await readFile(new URL('../src/mesh/N03AudioCapabilityRegistry.ts', import.meta.url), 'utf8');
const ownership = await readFile(new URL('../lib/soul-mesh/N03CapabilityOwnership.md', import.meta.url), 'utf8');
const cognitive = await readFile(new URL('../api/cognitive.ts', import.meta.url), 'utf8');
const chat = await readFile(new URL('../src/components/ChatInterface.tsx', import.meta.url), 'utf8');
const auth = await readFile(new URL('../src/components/AuthPage.tsx', import.meta.url), 'utf8');

assert.match(api, /sara\.clareira\.audit/);
assert.match(api, /\/v1\/clareira\/audit/);
assert.match(api, /const isGet=.*sara\.clareira\.audit/);
assert.match(audioRegistry, /audio\.transcribe/);
assert.match(audioRegistry, /speech\.synthesize/);
assert.match(ownership, /N03 is the canonical owner/);
assert.match(cognitive, /supabase\\.auth\\.getUser/);
assert.match(cognitive, /N03N02CapabilityBridge/);
assert.match(cognitive, /ai\\.generate/);
assert.doesNotMatch(chat, /INTEGRATED_API_KEY|Math\\.random\\(\\)|simulated|simulada/i);
assert.doesNotMatch(auth, /INTEGRATED_API_KEY|AIzaSy/i);

console.log('N03_CLAREIRA_SYMBIOSIS_CONTRACT: ok=true audit_consumer=true native_audio_registry=true ownership_preserved=true');
