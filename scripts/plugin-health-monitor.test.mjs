import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIssueBody,
  buildIssueTitle,
  countConsecutiveFailures,
  filterRunsByActors,
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
