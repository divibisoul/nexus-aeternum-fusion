import { test, expect } from 'bun:test';
import { describeN03ExternalCapabilityFabric, providersByFunction, resolveN03ExternalProvider } from './N03ExternalCapabilityFabric';

test('N03 fabric contains all 25 upstream sources',()=>{
 const f=describeN03ExternalCapabilityFabric();
 expect(f.providerCount).toBe(25);
 expect(resolveN03ExternalProvider('agentscope').revision).toBe('72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6');
 expect(resolveN03ExternalProvider('whisper').n03Functions).toContain('audio.transcribe.whisper@1.0.0');
 expect(resolveN03ExternalProvider('kokoro').n03Functions).toContain('speech.synthesize.kokoro@1.0.0');
});
test('N03 function affinity resolves direct perception providers',()=>{
 expect(providersByFunction('audio.transcribe').map(x=>x.id)).toEqual(['whisper']);
 expect(providersByFunction('speech.synthesize').map(x=>x.id)).toEqual(['kokoro']);
});
test('unknown provider fails closed',()=>{
 expect(()=>resolveN03ExternalProvider('unknown')).toThrow(/N03_EXTERNAL_PROVIDER_UNKNOWN/);
});
