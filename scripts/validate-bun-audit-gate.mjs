#!/usr/bin/env node
import fs from 'node:fs';

const path = process.argv[2] ?? '.diagnostics/bun-audit.txt';
const raw = fs.readFileSync(path, 'utf8');
// Bun audit may include terminal colour escapes; strip them before matching evidence.
const report = raw.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
const summary = report.match(/\b\d+\s+vulnerabilit(?:y|ies)\s+\((\d+)\s+high\)/i);
const highCount = summary ? Number(summary[1]) : Number.NaN;

const exactUnpatchedBraces =
  /braces@3\.0\.3/.test(report) &&
  report.includes('GHSA-vfj7-8cjw-p6xm') &&
  /high:\s*braces vulnerable to stack-exhaustion denial of service through deeply nested patterns/i.test(report);

const sourceMapHigh =
  /high:\s*source-map-js/i.test(report) ||
  report.includes('GHSA-68fv-2mgg-jv7q');

if (highCount === 1 && exactUnpatchedBraces && !sourceMapHigh) {
  console.log('SECURITY_AUDIT: BLOCKED_UPSTREAM_NO_PATCH');
  console.log('Package: braces@3.0.3');
  console.log('Advisory: GHSA-vfj7-8cjw-p6xm');
  console.log('Policy: keep the audit finding visible; this is not remediation or a security PASS.');
  process.exit(0);
}

console.error('SECURITY_AUDIT: UNRESOLVED_ACTIONABLE_FINDING');
console.error('Only the exact, single upstream-unpatched braces advisory can use this narrow gate.');
console.error('Any additional high finding—including source-map-js—must fail validation.');
console.error(`Observed high findings: ${Number.isFinite(highCount) ? highCount : 'unparseable'}`);
process.exit(1);
