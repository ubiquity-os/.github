import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFailureContext,
  buildAlertKey,
  collectFailureStreak,
  filterWorkflowDispatchRuns,
  findDuplicateAlertComment,
  extractAlertKey,
  normalizeAlertCommentBody,
  formatAlertComment,
  formatFailureContext
} from "./plugin-health-monitor-lib.mjs";

test("collectFailureStreak stops at first non-failure completed run", () => {
  const runs = [
    { status: "completed", conclusion: "failure", id: 3 },
    { status: "completed", conclusion: "failure", id: 2 },
    { status: "completed", conclusion: "success", id: 1 },
    { status: "in_progress", conclusion: null, id: 0 }
  ];

  const streak = collectFailureStreak(runs);

  assert.deepEqual(streak.map((run) => run.id), [3, 2]);
});

test("filterWorkflowDispatchRuns keeps only manual workflow_dispatch runs", () => {
  const runs = [
    { id: 1, event: "push" },
    { id: 2, event: "workflow_dispatch" },
    { id: 3, event: "schedule" },
    { id: 4, event: "workflow_dispatch" }
  ];

  assert.deepEqual(filterWorkflowDispatchRuns(runs).map((run) => run.id), [2, 4]);
});

test("formatFailureContext renders run and job details", () => {
  const lines = formatFailureContext({
    run_url: "https://github.com/org/repo/actions/runs/123",
    head_branch: "main",
    head_sha: "abcdef1234567890",
    failed_jobs: [
      {
        name: "build",
        html_url: "https://github.com/org/repo/actions/runs/123/job/456",
        failed_steps: ["lint", "test"]
      }
    ]
  });

  assert(lines.some((line) => line.includes("latest failed run")));
  assert(lines.some((line) => line.includes("branch `main`")));
  assert(lines.some((line) => line.includes("sha `abcdef1`")));
  assert(lines.some((line) => line.includes("`build`")));
  assert(lines.some((line) => line.includes("`lint`, `test`")));
});

test("formatAlertComment includes summary and report path", () => {
  const body = formatAlertComment(
    [
      {
        repo: "acme/plugin-a",
        workflow: "CI",
        consecutive_failures: 10,
        html_url: "https://github.com/acme/plugin-a/actions/workflows/1",
        failure_context: null
      }
    ],
    {
      alertTags: "@0x4007 @gentlementlegen",
      threshold: 10,
      org: "ubiquity-os-marketplace",
      outPath: "profile/plugin-health-report.json"
    }
  );

  assert.match(body, /@0x4007 @gentlementlegen/);
  assert.match(body, />= 10 consecutive workflow failures/);
  assert.match(body, /`acme\/plugin-a`/);
  assert.match(body, /Report written to `profile\/plugin-health-report\.json`/);
  assert.match(body, /<!-- plugin-health-monitor:/);
  assert.equal(extractAlertKey(body), buildAlertKey([
    {
      repo: "acme/plugin-a",
      workflow: "CI",
      consecutive_failures: 10,
      html_url: "https://github.com/acme/plugin-a/actions/workflows/1",
      failure_context: null
    }
  ], {
    alertTags: "@0x4007 @gentlementlegen",
    threshold: 10,
    org: "ubiquity-os-marketplace",
    outPath: "profile/plugin-health-report.json"
  }));
});

test("findDuplicateAlertComment returns the matching comment when bodies are identical", () => {
  const comments = [
    { body: "first", html_url: "https://github.com/example/1" },
    { body: "target body", html_url: "https://github.com/example/2" },
    { body: "other", html_url: "https://github.com/example/3" }
  ];

  const duplicate = findDuplicateAlertComment(comments, "target body");

  assert.deepEqual(duplicate, {
    body: "target body",
    html_url: "https://github.com/example/2"
  });
});

test("findDuplicateAlertComment matches on stable alert keys even if run URLs differ", () => {
  const findings = [
    {
      repo: "acme/plugin-a",
      workflow: "CI",
      consecutive_failures: 10,
      html_url: "https://github.com/acme/plugin-a/actions/workflows/1",
      failure_context: {
        run_url: "https://github.com/acme/plugin-a/actions/runs/111",
        logs_url: "https://github.com/acme/plugin-a/actions/runs/111/logs",
        head_branch: "main",
        head_sha: "abcdef1234567890",
        failed_jobs: []
      }
    }
  ];
  const context = {
    alertTags: "@0x4007 @gentlementlegen",
    threshold: 10,
    org: "ubiquity-os-marketplace",
    outPath: "profile/plugin-health-report.json"
  };
  const originalBody = formatAlertComment(findings, context);
  const legacyBody = originalBody
    .replace(/\n<!-- plugin-health-monitor:[A-Za-z0-9_-]+ -->$/, "")
    .replace("111", "222");

  const duplicate = findDuplicateAlertComment(
    [
      { body: legacyBody, html_url: "https://github.com/example/alert/1" },
      { body: "unrelated", html_url: "https://github.com/example/alert/2" }
    ],
    originalBody
  );

  assert.equal(extractAlertKey(originalBody), buildAlertKey(findings, context));
  assert.equal(
    normalizeAlertCommentBody(originalBody),
    normalizeAlertCommentBody(legacyBody)
  );
  assert.deepEqual(duplicate, {
    body: legacyBody,
    html_url: "https://github.com/example/alert/1"
  });
});

test("buildFailureContext keeps the latest failing run context and failed jobs", async () => {
  const calls = [];
  const api = async (path) => {
    calls.push(path);
    return {
      jobs: [
        {
          conclusion: "failure",
          name: "build",
          html_url: "https://github.com/org/repo/actions/runs/123/job/456",
          steps: [
            { conclusion: "failure", name: "lint" },
            { conclusion: "failure", name: "test" },
            { conclusion: "success", name: "package" }
          ]
        },
        {
          conclusion: "success",
          name: "docs",
          html_url: "https://github.com/org/repo/actions/runs/123/job/999",
          steps: [{ conclusion: "failure", name: "ignored" }]
        }
      ]
    };
  };

  const context = await buildFailureContext(api, {
    jobs_url: "https://api.github.com/repos/org/repo/actions/runs/123/jobs?per_page=100",
    html_url: "https://github.com/org/repo/actions/runs/123",
    logs_url: "https://github.com/org/repo/actions/runs/123/logs",
    head_branch: "main",
    head_sha: "abcdef1234567890"
  });

  assert.deepEqual(calls, ["/repos/org/repo/actions/runs/123/jobs?per_page=100"]);
  assert.equal(context.run_url, "https://github.com/org/repo/actions/runs/123");
  assert.equal(context.logs_url, "https://github.com/org/repo/actions/runs/123/logs");
  assert.equal(context.head_branch, "main");
  assert.equal(context.head_sha, "abcdef1234567890");
  assert.equal(context.failed_jobs.length, 1);
  assert.deepEqual(context.failed_jobs[0], {
    name: "build",
    html_url: "https://github.com/org/repo/actions/runs/123/job/456",
    failed_steps: ["lint", "test"]
  });

  const lines = formatFailureContext(context);
  assert(lines.some((line) => line.includes("logs: https://github.com/org/repo/actions/runs/123/logs")));
});
