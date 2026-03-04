import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIssueBody,
  buildIssueTitle,
  countConsecutiveFailures,
  filterRunsByActors,
  runPluginHealthMonitor,
} from "./plugin-health-monitor.mjs";

test("countConsecutiveFailures counts from latest run until first non-failure", () => {
  const runs = [
    { conclusion: "failure" },
    { conclusion: "timed_out" },
    { conclusion: "failure" },
    { conclusion: "success" },
    { conclusion: "failure" },
  ];

  assert.equal(countConsecutiveFailures(runs), 3);
});

test("countConsecutiveFailures returns 0 when latest run is successful", () => {
  const runs = [{ conclusion: "success" }, { conclusion: "failure" }];
  assert.equal(countConsecutiveFailures(runs), 0);
});

test("filterRunsByActors keeps only configured actors", () => {
  const runs = [
    { actor: { login: "ubiquity-app[bot]" }, conclusion: "failure" },
    { actor: { login: "someone-else" }, conclusion: "failure" },
  ];

  const filtered = filterRunsByActors(runs, ["ubiquity-app[bot]"]);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].actor.login, "ubiquity-app[bot]");
});

test("buildIssueTitle and body include repo marker and run links", () => {
  const title = buildIssueTitle("ubiquity-os-marketplace/example-plugin", 12);
  assert.match(title, /12 consecutive dispatch failures/);

  const body = buildIssueBody({
    repoFullName: "ubiquity-os-marketplace/example-plugin",
    failures: 12,
    threshold: 10,
    maintainers: ["@0x4007"],
    runs: [
      {
        name: "CI",
        run_number: 77,
        html_url: "https://github.com/example/actions/runs/77",
        conclusion: "failure",
        actor: { login: "ubiquity-app[bot]" },
        created_at: "2026-03-04T00:00:00Z",
      },
    ],
  });

  assert.match(body, /plugin-health-monitor:ubiquity-os-marketplace\/example-plugin/);
  assert.match(body, /CI #77/);
  assert.match(body, /@0x4007/);
});

function createGithubMock({ repos, runsByRepo, issuesByRepo, throwRepos = [] }) {
  const created = [];
  const updated = [];

  return {
    created,
    updated,
    github: {
      paginate: async (fn, params) => {
        if (fn.name === "listForOrg") {
          return repos;
        }
        if (fn.name === "listForRepo") {
          const key = `${params.owner}/${params.repo}`;
          return issuesByRepo[key] || [];
        }
        throw new Error(`Unexpected paginate function: ${fn.name}`);
      },
      rest: {
        repos: { listForOrg: async function listForOrg() {} },
        actions: {
          listWorkflowRunsForRepo: async ({ owner, repo }) => {
            const key = `${owner}/${repo}`;
            if (throwRepos.includes(key)) {
              throw new Error("simulated API error");
            }
            return { data: { workflow_runs: runsByRepo[key] || [] } };
          },
        },
        issues: {
          listForRepo: async function listForRepo() {},
          create: async (payload) => {
            created.push(payload);
            return { data: { number: 100 + created.length } };
          },
          update: async (payload) => {
            updated.push(payload);
            return { data: payload };
          },
        },
      },
    },
  };
}

test("runPluginHealthMonitor creates issue when threshold is met", async () => {
  process.env.TARGET_ORG = "ubiquity-os-marketplace";
  process.env.FAILURE_THRESHOLD = "2";
  process.env.ISSUE_MENTIONS = "@0x4007";
  process.env.DISPATCH_ACTORS = "";
  process.env.DRY_RUN = "false";

  const { github, created, updated } = createGithubMock({
    repos: [{ owner: { login: "ubiquity-os-marketplace" }, name: "repo-a", full_name: "ubiquity-os-marketplace/repo-a" }],
    runsByRepo: {
      "ubiquity-os-marketplace/repo-a": [
        { conclusion: "failure", run_number: 2, html_url: "https://x/2", created_at: "2026-03-04T00:00:00Z", actor: { login: "bot" }, name: "CI" },
        { conclusion: "failure", run_number: 1, html_url: "https://x/1", created_at: "2026-03-03T00:00:00Z", actor: { login: "bot" }, name: "CI" },
      ],
    },
    issuesByRepo: {},
  });

  const logs = [];
  const core = { info: (m) => logs.push(m), warning: (m) => logs.push(m) };
  const result = await runPluginHealthMonitor({ github, context: { runId: 1 }, core });

  assert.equal(result.alerts, 1);
  assert.equal(created.length, 1);
  assert.equal(updated.length, 0);
});

test("runPluginHealthMonitor updates existing marker issue", async () => {
  process.env.FAILURE_THRESHOLD = "2";
  process.env.DRY_RUN = "false";

  const markerIssue = {
    number: 12,
    body: "<!-- plugin-health-monitor:ubiquity-os-marketplace/repo-a -->",
  };

  const { github, created, updated } = createGithubMock({
    repos: [{ owner: { login: "ubiquity-os-marketplace" }, name: "repo-a", full_name: "ubiquity-os-marketplace/repo-a" }],
    runsByRepo: {
      "ubiquity-os-marketplace/repo-a": [
        { conclusion: "failure", run_number: 2, html_url: "https://x/2", created_at: "2026-03-04T00:00:00Z", actor: { login: "bot" }, name: "CI" },
        { conclusion: "failure", run_number: 1, html_url: "https://x/1", created_at: "2026-03-03T00:00:00Z", actor: { login: "bot" }, name: "CI" },
      ],
    },
    issuesByRepo: {
      "ubiquity-os-marketplace/repo-a": [markerIssue],
    },
  });

  const core = { info: () => {}, warning: () => {} };
  await runPluginHealthMonitor({ github, context: { runId: 2 }, core });

  assert.equal(created.length, 0);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].issue_number, 12);
});

test("runPluginHealthMonitor isolates per-repo API errors", async () => {
  process.env.FAILURE_THRESHOLD = "1";
  process.env.DRY_RUN = "true";

  const { github } = createGithubMock({
    repos: [
      { owner: { login: "ubiquity-os-marketplace" }, name: "repo-error", full_name: "ubiquity-os-marketplace/repo-error" },
      { owner: { login: "ubiquity-os-marketplace" }, name: "repo-ok", full_name: "ubiquity-os-marketplace/repo-ok" },
    ],
    runsByRepo: {
      "ubiquity-os-marketplace/repo-ok": [
        { conclusion: "failure", run_number: 1, html_url: "https://x/1", created_at: "2026-03-04T00:00:00Z", actor: { login: "bot" }, name: "CI" },
      ],
    },
    issuesByRepo: {},
    throwRepos: ["ubiquity-os-marketplace/repo-error"],
  });

  const warnings = [];
  const core = { info: () => {}, warning: (m) => warnings.push(m) };
  const result = await runPluginHealthMonitor({ github, context: { runId: 3 }, core });

  assert.equal(result.alerts, 1);
  assert.ok(warnings.some((m) => m.includes("Skipping ubiquity-os-marketplace/repo-error due to API error")));
});
