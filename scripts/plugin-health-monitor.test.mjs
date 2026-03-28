import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseThreshold,
  buildIssueBody,
  getConsecutiveFailures,
  runPluginHealthMonitor,
} from "./plugin-health-monitor.mjs";

// ─── parseThreshold ──────────────────────────────────────────

describe("parseThreshold", () => {
  it("parses valid integer", () => {
    assert.equal(parseThreshold("5"), 5);
    assert.equal(parseThreshold("20"), 20);
  });

  it("defaults to 10 for undefined", () => {
    assert.equal(parseThreshold(undefined), 10);
  });

  it("defaults to 10 for empty string", () => {
    assert.equal(parseThreshold(""), 10);
  });

  it("defaults to 10 for NaN input", () => {
    assert.equal(parseThreshold("abc"), 10);
  });

  it("defaults to 10 for zero", () => {
    assert.equal(parseThreshold("0"), 10);
  });

  it("defaults to 10 for negative", () => {
    assert.equal(parseThreshold("-5"), 10);
  });

  it("defaults to 10 for Infinity string", () => {
    assert.equal(parseThreshold("Infinity"), 10);
  });
});

// ─── buildIssueBody ──────────────────────────────────────────

describe("buildIssueBody", () => {
  const mockAlert = {
    repo: "test-plugin",
    count: 12,
    runs: [
      {
        id: 1,
        name: "CI",
        url: "https://github.com/org/repo/actions/runs/1",
        created_at: "2026-03-28T00:00:00Z",
        head_sha: "abc1234",
      },
      {
        id: 2,
        name: "CI",
        url: "https://github.com/org/repo/actions/runs/2",
        created_at: "2026-03-27T00:00:00Z",
        head_sha: "def5678",
      },
    ],
  };

  it("includes repo name", () => {
    const body = buildIssueBody(mockAlert, "@user1");
    assert.ok(body.includes("`test-plugin`"));
  });

  it("includes failure count", () => {
    const body = buildIssueBody(mockAlert, "@user1");
    assert.ok(body.includes("12"));
  });

  it("includes mentions", () => {
    const body = buildIssueBody(mockAlert, "@0x4007 @gentlementlegen");
    assert.ok(body.includes("@0x4007"));
    assert.ok(body.includes("@gentlementlegen"));
  });

  it("includes run links in table", () => {
    const body = buildIssueBody(mockAlert, "@user1");
    assert.ok(body.includes("[View](https://github.com/org/repo/actions/runs/1)"));
  });

  it("includes commit SHAs", () => {
    const body = buildIssueBody(mockAlert, "@user1");
    assert.ok(body.includes("`abc1234`"));
  });

  it("truncates body exceeding max length", () => {
    const longAlert = {
      repo: "test-plugin",
      count: 1000,
      runs: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: "CI-" + "x".repeat(200),
        url: "https://github.com/org/repo/actions/runs/" + i,
        created_at: "2026-03-28T00:00:00Z",
        head_sha: "abc1234",
      })),
    };
    const body = buildIssueBody(longAlert, "@user1");
    assert.ok(body.length <= 65536);
    assert.ok(body.includes("truncated"));
  });
});

// ─── getConsecutiveFailures ──────────────────────────────────

describe("getConsecutiveFailures", () => {
  it("returns 0 for empty runs", async () => {
    const mockGithub = {
      rest: {
        actions: {
          listWorkflowRunsForRepo: async () => ({
            data: { workflow_runs: [] },
          }),
        },
      },
    };
    const result = await getConsecutiveFailures(mockGithub, "org", "repo");
    assert.equal(result.count, 0);
  });

  it("counts consecutive failures from most recent", async () => {
    const mockGithub = {
      rest: {
        actions: {
          listWorkflowRunsForRepo: async () => ({
            data: {
              workflow_runs: [
                { conclusion: "failure", created_at: "2026-03-28T03:00:00Z", html_url: "u1", id: 1, name: "CI" },
                { conclusion: "failure", created_at: "2026-03-28T02:00:00Z", html_url: "u2", id: 2, name: "CI" },
                { conclusion: "failure", created_at: "2026-03-28T01:00:00Z", html_url: "u3", id: 3, name: "CI" },
                { conclusion: "success", created_at: "2026-03-27T12:00:00Z", html_url: "u4", id: 4, name: "CI" },
                { conclusion: "failure", created_at: "2026-03-27T06:00:00Z", html_url: "u5", id: 5, name: "CI" },
              ],
            },
          }),
        },
      },
    };
    const result = await getConsecutiveFailures(mockGithub, "org", "repo");
    assert.equal(result.count, 3); // Streak of 3, broken by success
    assert.equal(result.runs.length, 3);
  });

  it("returns 0 when most recent is success", async () => {
    const mockGithub = {
      rest: {
        actions: {
          listWorkflowRunsForRepo: async () => ({
            data: {
              workflow_runs: [
                { conclusion: "success", created_at: "2026-03-28T03:00:00Z", html_url: "u1", id: 1, name: "CI" },
                { conclusion: "failure", created_at: "2026-03-28T02:00:00Z", html_url: "u2", id: 2, name: "CI" },
              ],
            },
          }),
        },
      },
    };
    const result = await getConsecutiveFailures(mockGithub, "org", "repo");
    assert.equal(result.count, 0);
  });

  it("handles API errors gracefully", async () => {
    const mockGithub = {
      rest: {
        actions: {
          listWorkflowRunsForRepo: async () => {
            throw new Error("Not Found");
          },
        },
      },
    };
    const result = await getConsecutiveFailures(mockGithub, "org", "repo");
    assert.equal(result.count, 0);
  });
});

// ─── runPluginHealthMonitor (integration) ────────────────────

describe("runPluginHealthMonitor", () => {
  let savedEnv;

  beforeEach(() => {
    // Isolate env — no shared mutation (fixes PR #18 test issue)
    savedEnv = { ...process.env };
  });

  // Restore env after each test (node:test doesn't have afterEach in older versions)
  function withCleanEnv(fn) {
    return async () => {
      process.env.TARGET_ORG = "test-org";
      process.env.FAILURE_THRESHOLD = "2";
      process.env.DRY_RUN = "true";
      process.env.ISSUE_MENTIONS = "@test";
      try {
        await fn();
      } finally {
        Object.keys(process.env).forEach((key) => {
          if (!(key in savedEnv)) delete process.env[key];
          else process.env[key] = savedEnv[key];
        });
      }
    };
  }

  it(
    "reports no alerts when all plugins healthy",
    withCleanEnv(async () => {
      const mockGithub = {
        paginate: {
          iterator: function* (fn, opts) {
            yield {
              data: [{ name: "plugin-a", archived: false, disabled: false }],
            };
          },
        },
        rest: {
          repos: { listForOrg: {} },
          actions: {
            listWorkflowRunsForRepo: async () => ({
              data: { workflow_runs: [] },
            }),
          },
        },
      };
      const mockCore = {
        info: () => {},
        warning: () => {},
      };

      const result = await runPluginHealthMonitor({
        github: mockGithub,
        context: {},
        core: mockCore,
      });

      assert.equal(result.alerts.length, 0);
    })
  );

  it(
    "detects plugins exceeding threshold",
    withCleanEnv(async () => {
      const mockGithub = {
        paginate: {
          iterator: function* () {
            yield {
              data: [{ name: "broken-plugin", archived: false, disabled: false }],
            };
          },
        },
        rest: {
          repos: { listForOrg: {} },
          actions: {
            listWorkflowRunsForRepo: async () => ({
              data: {
                workflow_runs: [
                  { conclusion: "failure", created_at: "2026-03-28T03:00:00Z", html_url: "u1", id: 1, name: "CI" },
                  { conclusion: "failure", created_at: "2026-03-28T02:00:00Z", html_url: "u2", id: 2, name: "CI" },
                  { conclusion: "failure", created_at: "2026-03-28T01:00:00Z", html_url: "u3", id: 3, name: "CI" },
                ],
              },
            }),
          },
        },
      };
      const mockCore = {
        info: () => {},
        warning: () => {},
      };

      const result = await runPluginHealthMonitor({
        github: mockGithub,
        context: {},
        core: mockCore,
      });

      assert.equal(result.alerts.length, 1);
      assert.equal(result.alerts[0].repo, "broken-plugin");
      assert.equal(result.alerts[0].count, 3);
    })
  );
});
