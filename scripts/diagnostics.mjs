#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, '.diagnostics');
fs.mkdirSync(out, { recursive: true });

function capture(command, args = []) {
  try {
    const stdout = execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
    return { command, args, exitCode: 0, stdout, stderr: '' };
  } catch (error) {
    return { command, args, exitCode: typeof error?.status === 'number' ? error.status : 1, stdout: error?.stdout ?? '', stderr: error?.stderr ?? String(error) };
  }
}

function sha256(file) {
  try { return createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'); }
  catch { return null; }
}

const envNames = Object.keys(process.env).sort();
const environment = Object.fromEntries(envNames.map((name) => [name, /token|secret|key|password|credential/i.test(name) ? '[REDACTED]' : process.env[name]]));
const report = {
  schemaVersion: '2.0.0',
  generatedAt: new Date().toISOString(),
  git: capture('git', ['rev-parse', 'HEAD']),
  runner: { name: process.env.RUNNER_NAME ?? '', os: process.env.RUNNER_OS ?? '', arch: process.env.RUNNER_ARCH ?? '', runId: process.env.GITHUB_RUN_ID ?? '', sha: process.env.GITHUB_SHA ?? '' },
  runtime: { node: process.version, npm: capture('npm', ['--version']), bun: capture('bun', ['--version']), platform: process.platform, arch: process.arch, cpuCount: os.cpus().length },
  lockfile: { path: 'package-lock.json', sha256: sha256('package-lock.json') },
  package: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')),
  environment,
};

fs.writeFileSync(path.join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'environment.json'), `${JSON.stringify(environment, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'runner.txt'), `${JSON.stringify(report.runner, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'lockfile-sha256.txt'), `${report.lockfile.sha256 ?? 'MISSING'}\n`);
fs.writeFileSync(path.join(out, 'git.txt'), `${JSON.stringify(report.git, null, 2)}\n`);

const separator = process.argv.indexOf('--');
if (separator >= 0 && process.argv.length > separator + 1) {
  const [command, ...args] = process.argv.slice(separator + 1);
  const execution = capture(command, args);
  fs.writeFileSync(path.join(out, 'command.json'), `${JSON.stringify(execution, null, 2)}\n`);
  fs.writeFileSync(path.join(out, 'stdout.log'), execution.stdout);
  fs.writeFileSync(path.join(out, 'stderr.log'), execution.stderr);
  fs.writeFileSync(path.join(out, 'command-exit-code.txt'), `${execution.exitCode}\n`);
  console.log(JSON.stringify({ diagnostic: report, execution: { command, args, exitCode: execution.exitCode } }, null, 2));
  process.exitCode = execution.exitCode;
} else {
  console.log(JSON.stringify(report, null, 2));
}
