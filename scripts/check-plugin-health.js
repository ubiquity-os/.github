// Plugin Health Monitor
// Checks all repos in ubiquity-os-marketplace for 10 consecutive workflow failures.
// If found, opens an issue in this repo tagging maintainers.

const MARKETPLACE_ORG = "ubiquity-os-marketplace";
const MONITOR_REPO_OWNER = "ubiquity-os";
const MONITOR_REPO_NAME = ".github";
const CONSECUTIVE_FAILURES = 10;
const NOTIFY = ["@ubiquityoss", "@gentlementlegen"];

async function ghApi(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} for ${path}: ${text}`);
  }
  return res.json();
}

async function getRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await ghApi(
      `/orgs/${MARKETPLACE_ORG}/repos?per_page=100&page=${page}&type=public`
    );
    if (batch.length === 0) break;
    repos.push(...batch);
    page++;
  }
  return repos;
}

async function checkRepo(repo) {
  let runs;
  try {
    runs = await ghApi(
      `/repos/${MARKETPLACE_ORG}/${repo.name}/actions/runs?per_page=${CONSECUTIVE_FAILURES}`
    );
  } catch {
    // Repo may have no workflows — skip
    return null;
  }

  const workflowRuns = runs.workflow_runs || [];
  if (workflowRuns.length < CONSECUTIVE_FAILURES) return null;

  const allFailed = workflowRuns.every((r) => r.conclusion === "failure");
  if (allFailed) {
    return repo.name;
  }
  return null;
}

async function createIssue(failingPlugins) {
  const body = [
    `The following plugins have ${CONSECUTIVE_FAILURES} consecutive workflow failures:\n`,
    ...failingPlugins.map(
      (name) =>
        `- [${name}](https://github.com/${MARKETPLACE_ORG}/${name}/actions)`
    ),
    `\ncc ${NOTIFY.join(" ")}`,
  ].join("\n");

  const res = await fetch(
    `https://api.github.com/repos/${MONITOR_REPO_OWNER}/${MONITOR_REPO_NAME}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `Plugin Health Alert: ${failingPlugins.length} plugin(s) failing`,
        body,
        labels: ["plugin-health"],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create issue: ${res.status} ${text}`);
  }

  const issue = await res.json();
  console.log(`Created issue: ${issue.html_url}`);
}

async function main() {
  console.log(`Fetching repos from ${MARKETPLACE_ORG}...`);
  const repos = await getRepos();
  console.log(`Found ${repos.length} repos. Checking workflow health...`);

  const failingPlugins = [];

  for (const repo of repos) {
    const result = await checkRepo(repo);
    if (result) {
      console.log(`FAILING: ${result}`);
      failingPlugins.push(result);
    }
  }

  if (failingPlugins.length === 0) {
    console.log("All plugins healthy.");
    return;
  }

  console.log(
    `\n${failingPlugins.length} plugin(s) with ${CONSECUTIVE_FAILURES} consecutive failures.`
  );
  await createIssue(failingPlugins);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
