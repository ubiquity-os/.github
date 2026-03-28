// @ts-check

/**
 * Plugin Health Monitor for UbiquityOS Marketplace
 *
 * Scans all repos in @ubiquity-os-marketplace for consecutive
 * workflow_dispatch failures. Creates/updates alert issues when
 * failures exceed threshold.
 *
 * Fixes over PR #18:
 * - Uses CROSS_REPO_TOKEN for cross-repo issue creation
 * - Validates FAILURE_THRESHOLD (guards against NaN)
 * - Truncates issue body to stay under GitHub's 65536 char limit
 * - Isolates env in tests (no shared mutation)
 */

const ISSUE_TITLE_PREFIX = "🚨 Plugin Health Alert:";
const MAX_ISSUE_BODY_LENGTH = 60000; // GitHub limit is 65536, leave margin
const DISPATCH_EVENT = "workflow_dispatch";

/**
 * @param {object} params
 * @param {import("@octokit/rest").Octokit} params.github
 * @param {object} params.context
 * @param {object} params.core
 */
export async function runPluginHealthMonitor({ github, context, core }) {
  const targetOrg = process.env.TARGET_ORG || "ubiquity-os-marketplace";
  const threshold = parseThreshold(process.env.FAILURE_THRESHOLD);
  const isDryRun = process.env.DRY_RUN === "true";
  const mentions = process.env.ISSUE_MENTIONS || "@0x4007 @gentlementlegen";

  core.info(`Monitoring org: ${targetOrg}`);
  core.info(`Failure threshold: ${threshold}`);
  core.info(`Dry run: ${isDryRun}`);

  const repos = await listOrgRepos(github, targetOrg);
  core.info(`Found ${repos.length} repositories`);

  const alerts = [];

  for (const repo of repos) {
    const failures = await getConsecutiveFailures(github, targetOrg, repo.name);

    if (failures.count >= threshold) {
      core.warning(
        `${repo.name}: ${failures.count} consecutive failures (threshold: ${threshold})`
      );
      alerts.push({ repo: repo.name, ...failures });
    } else if (failures.count > 0) {
      core.info(`${repo.name}: ${failures.count} failures (below threshold)`);
    }
  }

  if (alerts.length === 0) {
    core.info("All plugins healthy. No alerts.");
    return { alerts: [], issues: [] };
  }

  core.warning(`${alerts.length} plugin(s) exceeded failure threshold`);

  if (isDryRun) {
    core.info("DRY RUN — skipping issue creation");
    return { alerts, issues: [] };
  }

  const issues = [];
  for (const alert of alerts) {
    const issue = await createOrUpdateAlertIssue(
      github,
      targetOrg,
      alert,
      mentions
    );
    issues.push(issue);
    core.info(`Alert issue: ${issue.html_url}`);
  }

  return { alerts, issues };
}

/**
 * Parse and validate the failure threshold.
 * @param {string|undefined} raw
 * @returns {number}
 */
export function parseThreshold(raw) {
  const parsed = Number.parseInt(raw || "10", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 10; // safe default
  }
  return parsed;
}

/**
 * List all non-archived repos in the target org.
 */
export async function listOrgRepos(github, org) {
  const repos = [];
  for await (const response of github.paginate.iterator(
    github.rest.repos.listForOrg,
    { org, type: "public", per_page: 100 }
  )) {
    for (const repo of response.data) {
      if (!repo.archived && !repo.disabled) {
        repos.push(repo);
      }
    }
  }
  return repos;
}

/**
 * Get consecutive workflow_dispatch failures for a repo.
 * Looks at the most recent workflow runs triggered by `workflow_dispatch`.
 */
export async function getConsecutiveFailures(github, org, repoName) {
  let runs;
  try {
    const response = await github.rest.actions.listWorkflowRunsForRepo({
      owner: org,
      repo: repoName,
      event: DISPATCH_EVENT,
      per_page: 30,
      status: "completed",
    });
    runs = response.data.workflow_runs;
  } catch (error) {
    // Repo may have no workflows
    return { count: 0, runs: [] };
  }

  if (!runs || runs.length === 0) {
    return { count: 0, runs: [] };
  }

  // Sort by created_at descending (most recent first)
  runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Count consecutive failures from the most recent run
  let count = 0;
  const failedRuns = [];

  for (const run of runs) {
    if (run.conclusion === "failure") {
      count++;
      failedRuns.push({
        id: run.id,
        name: run.name,
        url: run.html_url,
        created_at: run.created_at,
        head_sha: run.head_sha?.substring(0, 7),
      });
    } else {
      break; // Streak broken by a success
    }
  }

  return { count, runs: failedRuns };
}

/**
 * Create or update an alert issue in the failing repo.
 */
export async function createOrUpdateAlertIssue(
  github,
  org,
  alert,
  mentions
) {
  const title = `${ISSUE_TITLE_PREFIX} ${alert.repo}`;

  // Check for existing open alert issue
  const existing = await findExistingAlertIssue(github, org, alert.repo, title);

  const body = buildIssueBody(alert, mentions);

  if (existing) {
    // Update existing issue
    const updated = await github.rest.issues.update({
      owner: org,
      repo: alert.repo,
      issue_number: existing.number,
      body,
    });
    return updated.data;
  }

  // Create new issue
  const created = await github.rest.issues.create({
    owner: org,
    repo: alert.repo,
    title,
    body,
    labels: ["health-alert"],
  });
  return created.data;
}

/**
 * Find existing open alert issue by title prefix.
 */
async function findExistingAlertIssue(github, org, repoName, title) {
  try {
    const { data: issues } = await github.rest.issues.listForRepo({
      owner: org,
      repo: repoName,
      state: "open",
      per_page: 50,
    });
    return issues.find((i) => i.title === title) || null;
  } catch {
    return null;
  }
}

/**
 * Build the alert issue body with failure details.
 * Truncates to stay under GitHub's 65536 char limit.
 */
export function buildIssueBody(alert, mentions) {
  const lines = [
    `## 🚨 Plugin Health Alert`,
    "",
    `**Repository:** \`${alert.repo}\``,
    `**Consecutive failures:** ${alert.count}`,
    `**Last checked:** ${new Date().toISOString()}`,
    "",
    `cc ${mentions}`,
    "",
    "### Recent Failed Runs",
    "",
    "| # | Workflow | Date | SHA | Link |",
    "|---|---------|------|-----|------|",
  ];

  for (let i = 0; i < alert.runs.length; i++) {
    const run = alert.runs[i];
    lines.push(
      `| ${i + 1} | ${run.name || "N/A"} | ${run.created_at} | \`${run.head_sha || "N/A"}\` | [View](${run.url}) |`
    );
  }

  lines.push(
    "",
    "---",
    "",
    "> This issue was automatically created by the [Plugin Health Monitor]" +
      "(../.github/workflows/plugin-health-monitor.yml). " +
      "It will be updated on subsequent runs if the plugin continues to fail. " +
      "Close this issue once the problem is resolved."
  );

  let body = lines.join("\n");

  // Truncate if too long (GitHub limit: 65536 chars)
  if (body.length > MAX_ISSUE_BODY_LENGTH) {
    body =
      body.substring(0, MAX_ISSUE_BODY_LENGTH) +
      "\n\n⚠️ _Output truncated. See workflow run for full details._";
  }

  return body;
}
