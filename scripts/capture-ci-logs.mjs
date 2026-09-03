import fs from 'node:fs/promises';

const token = process.env.GITHUB_TOKEN?.trim();
const repository = process.env.GITHUB_REPOSITORY?.trim();
const runId = process.env.GITHUB_RUN_ID?.trim();
const apiBase = 'https://api.github.com';
const generatedAt = new Date().toISOString();

const report = { schemaVersion: '1.0.0', system: 'SOUL', generatedAt, repository, runId, state: 'DEGRADED', jobs: [], errors: [] };

if (!token || !repository || !runId) {
  report.errors.push('GITHUB_TOKEN, GITHUB_REPOSITORY and GITHUB_RUN_ID are required');
} else {
  const headers = { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28', 'user-agent': 'SOUL-CI-Log-Capture' };
  async function get(path) {
    const response = await fetch(`${apiBase}${path}`, { headers });
    const text = await response.text();
    if (!response.ok) throw new Error(`GITHUB_API_${response.status}:${path}:${text.slice(0, 1000)}`);
    return text ? JSON.parse(text) : null;
  }
  try {
    const jobsPayload = await get(`/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`);
    for (const job of jobsPayload?.jobs ?? []) {
      const item = { id: job.id, name: job.name, status: job.status, conclusion: job.conclusion, steps: job.steps ?? null, logState: 'UNAVAILABLE' };
      try {
        const response = await fetch(`${apiBase}/repos/${repository}/actions/jobs/${job.id}/logs`, { headers, redirect: 'manual' });
        const location = response.headers.get('location');
        if (response.ok) {
          item.logState = 'CAPTURED';
          item.logs = (await response.text()).slice(0, 500000);
        } else {
          item.logState = 'UNAVAILABLE';
          item.logError = `HTTP_${response.status}`;
          if (location) item.logLocationPresent = true;
        }
      } catch (error) {
        item.logState = 'ERROR';
        item.logError = error instanceof Error ? error.message : String(error);
      }
      report.jobs.push(item);
    }
    report.state = report.jobs.every((job) => job.logState === 'CAPTURED') ? 'HEALTHY' : 'DEGRADED';
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
}

const filename = `soul-job-logs-${Date.now()}.json`;
await fs.writeFile(filename, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ artifact: filename, state: report.state, jobs: report.jobs.length, errors: report.errors.length }, null, 2));
