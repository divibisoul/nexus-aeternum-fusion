#!/usr/bin/env node
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
const lock = JSON.parse(await fs.readFile('package-lock.json', 'utf8'));
const root = lock?.packages?.[''];
if (!root) throw new Error('LOCKFILE_ROOT_PACKAGE_MISSING');

function compare(name, expected = {}, actual = {}) {
  const failures = [];
  const names = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const dependency of [...names].sort()) {
    if (expected[dependency] !== actual[dependency]) failures.push({ name, dependency, expected: expected[dependency], actual: actual[dependency] });
  }
  return failures;
}

const mismatches = [
  ...compare('dependencies', packageJson.dependencies, root.dependencies),
  ...compare('devDependencies', packageJson.devDependencies, root.devDependencies),
];
const lockBytes = await fs.readFile('package-lock.json');
const report = {
  system: 'SOUL',
  nucleus: 'N03',
  invariant: 'package-manifest-lockfile-convergence',
  generatedAt: new Date().toISOString(),
  lockfileVersion: lock.lockfileVersion,
  packageName: packageJson.name,
  sha256: crypto.createHash('sha256').update(lockBytes).digest('hex'),
  state: mismatches.length ? 'FAIL' : 'PASS',
  mismatches,
};
await fs.writeFile('LOCKFILE-INTEGRITY.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (mismatches.length) process.exit(1);
