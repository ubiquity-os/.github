#!/usr/bin/env node
/**
 * Scan org repositories and flag workflows with >= N consecutive failures.
 * This is read-only and writes a JSON report for downstream notification.
 */
import fs from "node:fs/promises";
import {
  buildFailureContext,
  collectFailureStreak,
  findDuplicateAlertComment,
  formatAlertComment
} from "./plugin-health-monitor-lib.mjs";

const org = process.env.TARGET_ORG || "ubiquity-os-marketplace";
const threshold = Number(process.env.FAILURE_STREAK_THRESHOLD || "10");
const outPath = process.env.OUTPUT_PATH || "profile/plugin-health-report.json";
const token = process.env.GITHUB_TOKEN || "";
const alertRepo = process.env.ALERT_REPO || process.env.GITHUB_REPOSITORY || "ubiquity-os/.github";
const alertIssueNumber = Number(process.env.ALERT_ISSUE_NUMBER || "12");
const alertTags = process.env.ALERT_TAGS || "@0x4007 @gentlementlegen";

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(2);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "plugin-health-monitor"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perform a GitHub API request with a single rate-limit aware retry.
 */
async function api(path, init = {}) {
  const url = `https://api.github.com${path}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers || {})
      }
    });
    if (res.ok) {
      if (res.status === 204) {
        return null;
      }
      return res.json();
    }

    const retryAfter = Number(res.headers.get("retry-after") || "0");
    const rateRemaining = Number(res.headers.get("x-ratelimit-remaining") || "1");
    const rateReset = Number(res.headers.get("x-ratelimit-reset") || "0");
    const waitMs =
      retryAfter > 0
        ? retryAfter * 1000
        : rateRemaining === 0 && rateReset > 0
          ? Math.max(rateReset * 1000 - Date.now(), 1000)
          : 0;

    if (attempt === 0 && waitMs > 0) {
      await sleep(Math.min(waitMs, 5000));
      continue;
    }

    const body = await res.text();
    throw new Error(`GitHub API ${res.status} ${url}\n${body}`);
  }
}

/**
 * Enumerate public repositories in the monitored org and ignore archived entries.
 */
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

/**
 * Collect the consecutive completed failures from newest to oldest.
 */
/**
 * Post an alert back to the tracking issue so the finding is visible to maintainers.
 */
async function postAlertComment(findings) {
  const body = formatAlertComment(findings, {
    alertTags,
    threshold,
    org,
    outPath
  });
  const comments = await api(
    `/repos/${alertRepo}/issues/${alertIssueNumber}/comments?per_page=100&sort=created&direction=desc`
  );
  const duplicate = findDuplicateAlertComment(comments, body);
  if (duplicate?.html_url) {
    return {
      html_url: duplicate.html_url,
      duplicate: true
    };
  }
  const response = await api(`/repos/${alertRepo}/issues/${alertIssueNumber}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
  return response;
}

/**
 * Main monitor flow: scan repos, compute failure streaks, emit a report, and alert if needed.
 */
async function main() {
  const repos = await listOrgRepos();
  const findings = [];

  for (const repo of repos) {
    const workflows = await api(`/repos/${repo.full_name}/actions/workflows?per_page=100`);
    for (const wf of workflows.workflows ?? []) {
      const runs = await api(
        `/repos/${repo.full_name}/actions/workflows/${wf.id}/runs?per_page=30&exclude_pull_requests=true`
      );
      const streakRuns = collectFailureStreak(runs.workflow_runs ?? []);
      if (streakRuns.length >= threshold) {
        const failureContext = await buildFailureContext(api, streakRuns[0]);
        findings.push({
          repo: repo.full_name,
          workflow: wf.name,
          workflow_id: wf.id,
          consecutive_failures: streakRuns.length,
          html_url: wf.html_url,
          failure_context: failureContext
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
    findings,
    alert_repo: alertRepo,
    alert_issue_number: alertIssueNumber
  };

  await fs.writeFile(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));

  if (findings.length > 0) {
    const comment = await postAlertComment(findings);
    if (comment?.html_url) {
      report.alert_comment_url = comment.html_url;
      report.alert_comment_duplicate = Boolean(comment?.duplicate);
      await fs.writeFile(outPath, JSON.stringify(report, null, 2) + "\n");
      console.log(JSON.stringify({ alert_comment_url: comment.html_url }, null, 2));
    }
    process.exit(1);
  }
}

await main();
