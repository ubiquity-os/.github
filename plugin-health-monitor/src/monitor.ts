import { request } from "https";
import { execSync } from "child_process";

const ORG = "ubiquity-os-marketplace";
const TARGET_REPO = { owner: "ubiquity-os", repo: ".github" };
const CONSECUTIVE_FAILURE_THRESHOLD = 10;
const MAINTAINERS = ["@0x4007", "@gentlementlegen"];

function apiRequest(path: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: "api.github.com",
        path,
        method: "GET",
        headers: {
          "User-Agent": "plugin-health-monitor",
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function postRequest(path: string, token: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = request(
      {
        hostname: "api.github.com",
        path,
        method: "POST",
        headers: {
          "User-Agent": "plugin-health-monitor",
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

async function listOrgRepos(token: string): Promise<string[]> {
  const repos: string[] = [];
  let page = 1;
  while (true) {
    const res = await apiRequest(`/orgs/${ORG}/repos?type=all&per_page=100&page=${page}`, token);
    if (res.status !== 200) {
      console.error(`Failed to list repos: ${res.status}`, res.data);
      break;
    }
    const pageRepos = res.data.map((r: any) => r.name);
    repos.push(...pageRepos);
    if (pageRepos.length < 100) break;
    page++;
  }
  return repos;
}

async function checkConsecutiveFailures(repo: string, token: string): Promise<number> {
  const res = await apiRequest(
    `/repos/${ORG}/${repo}/actions/runs?per_page=10&status=completed`,
    token
  );
  if (res.status !== 200) {
    console.warn(`Could not fetch runs for ${repo}: ${res.status}`);
    return 0;
  }

  const runs: any[] = res.data.workflow_runs || [];
  if (runs.length === 0) return 0;

  // Sort by run_number descending to get most recent first
  runs.sort((a: any, b: any) => b.run_number - a.run_number);

  let consecutive = 0;
  for (const run of runs) {
    if (run.conclusion === "failure") {
      consecutive++;
    } else {
      break;
    }
  }
  return consecutive;
}

async function findExistingHealthIssue(token: string): Promise<number | null> {
  const res = await apiRequest(
    `/repos/${TARGET_REPO.owner}/${TARGET_REPO.repo}/issues?labels=plugin-health&state=open&per_page=1`,
    token
  );
  if (res.status === 200 && res.data.length > 0) {
    return res.data[0].number;
  }
  return null;
}

async function createOrUpdateIssue(token: string, failedRepos: { name: string; failures: number }[]): Promise<void> {
  const tagMaintainers = MAINTAINERS.join(" ");
  const body = [
    `## 🔴 Plugin Health Alert`,
    ``,
    `The following plugins in **@${ORG}** have **${CONSECUTIVE_FAILURE_THRESHOLD}+ consecutive workflow failures**:`,
    ``,
    ...failedRepos.map(
      (r) => `- **[${r.name}](https://github.com/${ORG}/${r.name})** — ${r.failures} consecutive failures`
    ),
    ``,
    `${tagMaintainers} — please investigate.`,
    ``,
    `*This issue was automatically created by the Plugin Health Monitor cron job.*`,
  ].join("\n");

  const existingIssue = await findExistingHealthIssue(token);

  if (existingIssue) {
    // Post a comment on the existing issue
    await postRequest(
      `/repos/${TARGET_REPO.owner}/${TARGET_REPO.repo}/issues/${existingIssue}/comments`,
      token,
      { body }
    );
    console.log(`Updated existing issue #${existingIssue} with latest health report.`);
  } else {
    // Create a new issue
    await postRequest(
      `/repos/${TARGET_REPO.owner}/${TARGET_REPO.repo}/issues`,
      token,
      {
        title: "🔴 Plugin Health Alert: Consecutive Failures Detected",
        body,
        labels: ["plugin-health", "automated"],
      }
    );
    console.log("Created new health alert issue.");
  }
}

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN environment variable is required.");
    process.exit(1);
  }

  console.log(`Checking plugins in @${ORG}...`);
  const repos = await listOrgRepos(token);
  console.log(`Found ${repos.length} repositories.`);

  const failedRepos: { name: string; failures: number }[] = [];

  for (const repo of repos) {
    const failures = await checkConsecutiveFailures(repo, token);
    if (failures >= CONSECUTIVE_FAILURE_THRESHOLD) {
      failedRepos.push({ name: repo, failures });
      console.log(`⚠️  ${repo}: ${failures} consecutive failures`);
    } else if (failures > 0) {
      console.log(`  ${repo}: ${failures} consecutive failures (below threshold)`);
    }
  }

  if (failedRepos.length === 0) {
    console.log("✅ All plugins are healthy. No action needed.");
    return;
  }

  console.log(`\n🚨 ${failedRepos.length} plugin(s) have ${CONSECUTIVE_FAILURE_THRESHOLD}+ consecutive failures.`);
  await createOrUpdateIssue(token, failedRepos);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
