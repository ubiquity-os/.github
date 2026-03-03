const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "startup_failure",
  "action_required",
]);

const BREAK_CONCLUSIONS = new Set([
  "success",
  "neutral",
  "skipped",
  "cancelled",
]);

export function filterRunsByActors(runs, allowedActors = []) {
  if (!allowedActors.length) {
    return runs;
  }

  const allow = new Set(allowedActors.map((actor) => actor.toLowerCase().trim()));
  return runs.filter((run) => allow.has((run.actor?.login || "").toLowerCase()));
}

export function countConsecutiveFailures(runs) {
  let count = 0;

  for (const run of runs) {
    const conclusion = run?.conclusion || "";

    if (FAILURE_CONCLUSIONS.has(conclusion)) {
      count += 1;
      continue;
    }

    if (BREAK_CONCLUSIONS.has(conclusion) || !conclusion) {
      break;
    }

    break;
  }

  return count;
}

function toMarker(repoFullName) {
  return `<!-- plugin-health-monitor:${repoFullName} -->`;
}

export function buildIssueTitle(repoFullName, failures) {
  return `[Plugin Health Monitor] ${repoFullName} has ${failures} consecutive dispatch failures`;
}

export function buildIssueBody({
  repoFullName,
  failures,
  threshold,
  maintainers,
  runs,
}) {
  const marker = toMarker(repoFullName);
  const ping = maintainers.length ? maintainers.join(" ") : "@0x4007 @gentlementlegen";

  const lines = runs.map((run, index) => {
    const actor = run.actor?.login || "unknown";
    return `${index + 1}. [${run.name || "workflow"} #${run.run_number}](${run.html_url}) — \`${run.conclusion}\` by @${actor} at ${run.created_at}`;
  });

  return [
    marker,
    "## Plugin Health Alert",
    "",
    `Detected **${failures} consecutive failed workflow_dispatch runs** (threshold: ${threshold}) for \`${repoFullName}\`.`,
    "",
    "### Most recent runs",
    ...(lines.length ? lines : ["- No run details available."]),
    "",
    `cc ${ping}`,
    "",
    "_Generated automatically by plugin health monitor workflow._",
  ].join("\n");
}

async function findOpenMonitorIssue(github, owner, repo, marker) {
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  return issues.find((issue) => {
    const isPR = !!issue.pull_request;
    return !isPR && typeof issue.body === "string" && issue.body.includes(marker);
  });
}

export async function runPluginHealthMonitor({ github, context, core }) {
  const org = process.env.TARGET_ORG || "ubiquity-os-marketplace";
  const threshold = Number.parseInt(process.env.FAILURE_THRESHOLD || "10", 10);
  const dryRun = (process.env.DRY_RUN || "false").toLowerCase() === "true";
  const maintainers = (process.env.ISSUE_MENTIONS || "@0x4007,@gentlementlegen")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedActors = (process.env.DISPATCH_ACTORS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  core.info(`Scanning org ${org} with threshold ${threshold}`);

  const repos = await github.paginate(github.rest.repos.listForOrg, {
    org,
    type: "public",
    per_page: 100,
  });

  let alerts = 0;

  for (const repo of repos) {
    const owner = repo.owner.login;
    const repoName = repo.name;
    const fullName = repo.full_name;

    const runsResponse = await github.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo: repoName,
      event: "workflow_dispatch",
      status: "completed",
      per_page: 50,
    });

    const filteredRuns = filterRunsByActors(runsResponse.data.workflow_runs || [], allowedActors);
    const failures = countConsecutiveFailures(filteredRuns);

    if (failures < threshold) {
      continue;
    }

    alerts += 1;
    const runsToInclude = filteredRuns.slice(0, Math.max(failures, threshold));
    const marker = toMarker(fullName);
    const title = buildIssueTitle(fullName, failures);
    const body = buildIssueBody({
      repoFullName: fullName,
      failures,
      threshold,
      maintainers,
      runs: runsToInclude,
    });

    core.warning(`${fullName} exceeded failure threshold (${failures})`);

    if (dryRun) {
      core.info(`[dry-run] would create/update issue in ${fullName}`);
      continue;
    }

    const existingIssue = await findOpenMonitorIssue(github, owner, repoName, marker);

    if (existingIssue) {
      await github.rest.issues.update({
        owner,
        repo: repoName,
        issue_number: existingIssue.number,
        title,
        body,
      });
      core.info(`Updated monitor issue in ${fullName}: #${existingIssue.number}`);
      continue;
    }

    const created = await github.rest.issues.create({
      owner,
      repo: repoName,
      title,
      body,
    });

    core.info(`Created monitor issue in ${fullName}: #${created.data.number}`);
  }

  core.info(`Plugin health monitor finished. Alerts raised: ${alerts}`);

  if (!alerts) {
    core.info("No repos crossed the consecutive failure threshold.");
  }

  return { org, threshold, alerts, runId: context.runId };
}
