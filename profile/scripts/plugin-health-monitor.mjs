#!/usr/bin/env node
/**
 * Scan org repositories and flag workflows with >= N consecutive failures.
 * This is read-only and writes a JSON report for downstream notification.
 */
import fs from "node:fs/promises";

const org = process.env.TARGET_ORG || "ubiquity-os-marketplace";
const threshold = Number(process.env.FAILURE_STREAK_THRESHOLD || "10");
const outPath = process.env.OUTPUT_PATH || "profile/plugin-health-report.json";
const token = process.env.GITHUB_TOKEN || "";

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(2);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "plugin-health-monitor"
};

async function api(path) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} ${url}\n${body}`);
  }
  return res.json();
}

async function listOrgRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await api(`/orgs/${org}/repos?per_page=100&page=${page}&type=public`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const repo of batch) {
      repos.push({ name: repo.name, full_name: repo.full_name, archived: repo.archived });
    }
    page += 1;
  }
  return repos.filter(r => !r.archived);
}

function consecutiveFailureCount(runs) {
  let count = 0;
  for (const run of runs) {
    if (run.status !== "completed") continue;
    if (run.conclusion === "failure") {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

async function main() {
  const repos = await listOrgRepos();
  const findings = [];

  for (const repo of repos) {
    const workflows = await api(`/repos/${repo.full_name}/actions/workflows?per_page=100`);
    for (const wf of workflows.workflows ?? []) {
      const runs = await api(
        `/repos/${repo.full_name}/actions/workflows/${wf.id}/runs?per_page=30&exclude_pull_requests=true`
      );
      const streak = consecutiveFailureCount(runs.workflow_runs ?? []);
      if (streak >= threshold) {
        findings.push({
          repo: repo.full_name,
          workflow: wf.name,
          workflow_id: wf.id,
          consecutive_failures: streak,
          html_url: wf.html_url
        });
      }
    }
  }

  const report = {
    checked_at: new Date().toISOString(),
    org,
    threshold,
    repositories_scanned: repos.length,
    findings_count: findings.length,
    findings
  };

  await fs.writeFile(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));

  if (findings.length > 0) {
    process.exit(1);
  }
}

await main();
