import crypto from 'node:crypto';

const source = process.env.SOUL_MESH_NUCLEUS ?? 'N03';
const peers = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'].filter((n) => n !== source);
const urls = Object.fromEntries(peers.map((peer) => [peer, process.env[`SOUL_MESH_${peer}_URL`]]));

function channelId(target, slot) {
  return `${source}.OUT.${slot}.${target}`;
}

async function send(target, slot) {
  const url = urls[target];
  if (!url) throw new Error(`SOUL_MESH_ENDPOINT_NOT_CONFIGURED:${target}`);
  const correlationId = crypto.randomUUID();
  const message = {
    protocol: 'soul-mesh/1', nucleus: source, source, target,
    channelId: channelId(target, slot), capability: 'mesh.handshake', kind: 'request',
    id: correlationId, correlationId, timestamp: new Date().toISOString(),
    payload: { probe: 'direct-peer-handshake', source },
  };
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.SOUL_MESH_TOKEN ? { authorization: `Bearer ${process.env.SOUL_MESH_TOKEN}` } : {}) }, body: JSON.stringify(message), signal: AbortSignal.timeout(Number(process.env.SOUL_MESH_TIMEOUT_MS ?? 5000)) });
  const body = await response.json().catch(() => ({}));
  const passed = response.ok && body.correlationId === correlationId && body.proof === 'EXECUTED' && body.source === target && body.target === source && body.channelId === message.channelId;
  return { source, target, slot, channelId: message.channelId, correlationId, httpStatus: response.status, passed, body };
}

const results = await Promise.all(peers.flatMap((target) => Array.from({ length: 5 }, (_, i) => send(target, i + 1))));
const failed = results.filter((r) => !r.passed);
console.log(JSON.stringify({ source, total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
