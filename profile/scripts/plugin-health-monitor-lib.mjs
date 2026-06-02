/**
 * Collect the consecutive completed failures from newest to oldest.
 */
export function collectFailureStreak(runs) {
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
export async function buildFailureContext(api, run) {
  if (!run?.jobs_url) {
    return {
      run_url: run?.html_url || null,
      logs_url: run?.logs_url || null,
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
    logs_url: run.logs_url || null,
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

export function formatFailureContext(failureContext) {
  if (!failureContext) {
    return [];
  }

  const lines = [];
  if (failureContext.run_url) {
    lines.push(`  - latest failed run: ${failureContext.run_url}`);
  }
  if (failureContext.logs_url) {
    lines.push(`  - logs: ${failureContext.logs_url}`);
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
export function formatAlertComment(findings, context) {
  const { alertTags, threshold, org, outPath } = context;
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
 * Find an existing alert comment with an identical body so the monitor can reuse it.
 */
export function findDuplicateAlertComment(comments, body) {
  if (!Array.isArray(comments) || !body) {
    return null;
  }

  return comments.find((comment) => comment?.body === body) || null;
}
