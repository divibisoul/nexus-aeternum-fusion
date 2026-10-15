import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const n02Workdir = process.env.SOUL_N02_WORKDIR;
if (!n02Workdir || !existsSync(resolve(n02Workdir, 'scripts/soul-mesh-server.ts'))) {
  throw new Error('SOUL_N02_WORKDIR must point to the checked-out N02 runtime source.');
}

const n02Port = Number(process.env.SOUL_TEST_N02_PORT || 18202);
const n03Port = Number(process.env.SOUL_TEST_N03_PORT || 18203);
const n02Url = 'http://127.0.0.1:' + n02Port;
const n03Url = 'http://127.0.0.1:' + n03Port;
const sharedSecret = randomBytes(48).toString('hex');
const baseEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  NODE_ENV: 'test',
  SOUL_MESH_HMAC_SECRET: sharedSecret,
};
const servers = [];
const output = new Map();

function startServer(name, command, args, cwd, env) {
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  servers.push(child);
  output.set(name, '');
  const collect = chunk => output.set(name, (output.get(name) + String(chunk)).slice(-16000));
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.on('error', error => collect(String(error)));
  return child;
}

function assertLive(child, name) {
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(name + ' exited before E2E completed. Logs:\n' + output.get(name));
  }
}

async function jsonResponse(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function waitForHealth(name, child, url, expectedNucleus) {
  let lastError = 'no response';
  for (let attempt = 0; attempt < 60; attempt += 1) {
    assertLive(child, name);
    try {
      const result = await jsonResponse(url + '/mesh/health');
      if (result.response.ok && result.body?.nucleus === expectedNucleus
        && result.body?.protocol === 'soul-mesh/1' && result.body?.contractVersion === '1.1.0') {
        return result.body;
      }
      lastError = 'HTTP ' + result.response.status + ': ' + JSON.stringify(result.body);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
  }
  throw new Error(name + ' health did not become ready: ' + lastError + '\n' + output.get(name));
}

function runOneShot(name, command, args, cwd, env, timeoutMs = 25000) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let captured = '';
    const collect = chunk => { captured = (captured + String(chunk)).slice(-20000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', error => rejectPromise(new Error(name + ' failed to start: ' + error.message)));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error(name + ' timed out.\n' + captured));
    }, timeoutMs);
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolvePromise(captured);
      else rejectPromise(new Error(name + ' exited with ' + code + '.\n' + captured));
    });
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolveExit => child.once('exit', resolveExit)),
    new Promise(resolveDelay => setTimeout(resolveDelay, 4000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

try {
  const n02 = startServer(
    'N02',
    process.execPath,
    ['--experimental-transform-types', '--loader', './scripts/n02-ts-extension-loader.mjs', 'scripts/soul-mesh-server.ts'],
    resolve(n02Workdir),
    {
      ...baseEnv,
      SOUL_MESH_HOST: '127.0.0.1',
      SOUL_MESH_PORT: String(n02Port),
      SOUL_MESH_N03_URL: n03Url + '/api/soul-mesh',
    },
  );
  const n03 = startServer(
    'N03',
    process.execPath,
    ['--experimental-strip-types', 'scripts/soul-mesh-server.ts'],
    process.cwd(),
    {
      ...baseEnv,
      SOUL_MESH_HOST: '127.0.0.1',
      SOUL_MESH_PORT: String(n03Port),
    },
  );

  const [n02Health, n03Health] = await Promise.all([
    waitForHealth('N02', n02, n02Url, 'N02'),
    waitForHealth('N03', n03, n03Url, 'N03'),
  ]);

  const [n02Ready, n03Ready] = await Promise.all([
    jsonResponse(n02Url + '/ready'),
    jsonResponse(n03Url + '/ready'),
  ]);
  if (!n02Ready.response.ok || n02Ready.body?.checks?.meshSecretConfigured !== true) {
    throw new Error('N02 readiness/HMAC precondition failed: ' + JSON.stringify(n02Ready.body));
  }
  if (!n03Ready.response.ok || n03Ready.body?.checks?.authConfigured !== true) {
    throw new Error('N03 readiness/HMAC precondition failed: ' + JSON.stringify(n03Ready.body));
  }

  const n02ClientDriver = [
    "import { requestPeerCapability } from './api/soul-mesh/peer-client.ts';",
    "const r = await requestPeerCapability('N03', 'mesh.ping', { probe: 'N02_N03_REAL_PROCESS_PAIR' }, 5000, 0);",
    "if (r.kind !== 'response' || r.source !== 'N03' || r.target !== 'N02' || r.payload?.ok !== true || r.payload?.handler !== 'N03.mesh.ping') throw new Error('N02_TO_N03_CONTRACT_OR_HMAC_FAILED: ' + JSON.stringify(r));",
    "console.log('N02_TO_N03_REAL_PROCESS_E2E_PASS ' + JSON.stringify({ source: r.source, target: r.target, capability: r.capability, transport: 'HTTP', requestAuthentication: 'HMAC-SHA256', responseAuthentication: 'HMAC-SHA256', responsePayload: r.payload }));",
  ].join('\n');

  const n02ClientEvidence = await runOneShot(
    'N02 active peer client → N03 actual server',
    process.execPath,
    ['--experimental-transform-types', '--loader', './scripts/n02-ts-extension-loader.mjs', '--input-type=module', '-e', n02ClientDriver],
    resolve(n02Workdir),
    {
      ...baseEnv,
      SOUL_MESH_N03_URL: n03Url + '/api/soul-mesh',
    },
  );
  if (!n02ClientEvidence.includes('N02_TO_N03_REAL_PROCESS_E2E_PASS')) {
    throw new Error('N02 active peer client did not produce its real-process pass marker.\n' + n02ClientEvidence);
  }

  const n03RegistrationDriver = [
    "import { getPeerState, startN03PeerRegistration } from './src/mesh/N03PeerRegistration.ts';",
    "startN03PeerRegistration();",
    "const deadline = Date.now() + 22000;",
    "while (Date.now() < deadline) {",
    "  const state = getPeerState('N02');",
    "  if (state?.status === 'healthy') {",
    "    console.log('N03_TO_N02_REAL_PROCESS_E2E_PASS ' + JSON.stringify({ source: 'N03', target: 'N02', transport: 'HTTP', requestAuthentication: 'HMAC-SHA256', responseAuthentication: 'HMAC-SHA256', capabilityCount: state.capabilities.length }));",
    "    process.exit(0);",
    "  }",
    "  if (state?.status === 'unavailable') throw new Error('N03 registration to N02 did not authenticate in either direction.');",
    "  await new Promise(resolveDelay => setTimeout(resolveDelay, 100));",
    "}",
    "throw new Error('N03 registration to N02 remained unmeasurable after the bounded wait.');",
  ].join('\n');

  const n03ClientEvidence = await runOneShot(
    'N03 registration client → N02 actual server',
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', n03RegistrationDriver],
    process.cwd(),
    {
      ...baseEnv,
      SOUL_MESH_N02_URL: n02Url,
    },
    25000,
  );
  if (!n03ClientEvidence.includes('N03_TO_N02_REAL_PROCESS_E2E_PASS')) {
    throw new Error('N03 registration client did not produce its real-process pass marker.\n' + n03ClientEvidence);
  }

  console.log(JSON.stringify({
    system: 'SOUL',
    stage: 'N02_N03_REAL_PROCESS_PAIR_E2E',
    status: 'PASS',
    evidence: {
      independentN02Server: n02Health.nucleus,
      independentN03Server: n03Health.nucleus,
      n02ClientToN03Server: n02ClientEvidence.trim(),
      n03RegistrationClientToN02Server: n03ClientEvidence.trim(),
      transport: 'HTTP',
      requestAuthentication: 'HMAC-SHA256',
      responseAuthentication: 'HMAC-SHA256',
      testSecret: 'ephemeral process environment; never persisted',
    },
    checkedAt: new Date().toISOString(),
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    system: 'SOUL',
    stage: 'N02_N03_REAL_PROCESS_PAIR_E2E',
    status: 'FAILED',
    error: error instanceof Error ? error.message : String(error),
    serverLogs: Object.fromEntries(output),
  }, null, 2));
  process.exitCode = 1;
} finally {
  await Promise.all(servers.reverse().map(stop));
}
