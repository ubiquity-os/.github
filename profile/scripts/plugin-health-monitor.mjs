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
function collectFailureStreak(runs) {
  const streak = [];
  for (const run of runs) {
    if (run.status !== "completed") continue;
    if (run.conclusion === "failure") {
      streak.push(run);
      continue;
    }
    break;
  }
  return streak;
}

/**
 * Attach the latest failed run and failed jobs so the alert points directly at useful context.
 */
async function buildFailureContext(run) {
  if (!run?.jobs_url) {
    return {
      run_url: run?.html_url || null,
      head_branch: run?.head_branch || null,
      head_sha: run?.head_sha || null,
      failed_jobs: []
    };
  }

  const jobsUrl = new URL(run.jobs_url);
  const jobs = await api(`${jobsUrl.pathname}${jobsUrl.search}`);
  const failedJobs = Array.isArray(jobs?.jobs)
    ? jobs.jobs.filter((job) => job?.conclusion === "failure")
    : [];

  return {
    run_url: run.html_url || null,
    head_branch: run.head_branch || null,
    head_sha: run.head_sha || null,
    failed_jobs: failedJobs.slice(0, 3).map((job) => ({
      name: job.name,
      html_url: job.html_url || null,
      failed_steps: Array.isArray(job.steps)
        ? job.steps.filter((step) => step?.conclusion === "failure").map((step) => step.name).slice(0, 5)
        : []
    }))
  };
}

function formatFailureContext(failureContext) {
  if (!failureContext) {
    return [];
  }

  const lines = [];
  if (failureContext.run_url) {
    lines.push(`  - latest failed run: ${failureContext.run_url}`);
  }

  const runBits = [];
  if (failureContext.head_branch) {
    runBits.push(`branch \`${failureContext.head_branch}\``);
  }
  if (failureContext.head_sha) {
    runBits.push(`sha \`${String(failureContext.head_sha).slice(0, 7)}\``);
  }
  if (runBits.length > 0) {
    lines.push(`  - run context: ${runBits.join(", ")}`);
  }

  if (Array.isArray(failureContext.failed_jobs) && failureContext.failed_jobs.length > 0) {
    lines.push("  - failed jobs:");
    for (const job of failureContext.failed_jobs) {
      const label = job.html_url ? `: ${job.html_url}` : "";
      lines.push(`    - \`${job.name}\`${label}`);
      if (Array.isArray(job.failed_steps) && job.failed_steps.length > 0) {
        lines.push(`      - failed steps: ${job.failed_steps.map((step) => `\`${step}\``).join(", ")}`);
      }
    }
  }

  return lines;
}

/**
 * Render a compact issue comment that is easy for maintainers to scan.
 */
function formatAlertComment(findings) {
  const sample = findings.slice(0, 5);
  const extra = findings.length - sample.length;
  const lines = [
    `${alertTags} Plugin Health Monitor found ${findings.length} repo(s) with >= ${threshold} consecutive workflow failures in \`${org}\`.`,
    "",
    "Top findings:",
    ...sample.flatMap((finding) => [
      `- \`${finding.repo}\` / \`${finding.workflow}\`: ${finding.consecutive_failures} consecutive failures -> ${finding.html_url}`,
      ...formatFailureContext(finding.failure_context)
    ]),
  ];
  if (extra > 0) {
    lines.push(`- ...and ${extra} more`);
  }
  lines.push("", `Report written to \`${outPath}\`.`);
  return lines.join("\n");
}

/**
 * Post an alert back to the tracking issue so the finding is visible to maintainers.
 */
async function postAlertComment(findings) {
  const body = formatAlertComment(findings);
  const comments = await api(
    `/repos/${alertRepo}/issues/${alertIssueNumber}/comments?per_page=100&sort=created&direction=desc`
  );
  const duplicate = Array.isArray(comments)
    ? comments.find((comment) => comment?.body === body)
    : null;
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
        const failureContext = await buildFailureContext(streakRuns[0]);
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
