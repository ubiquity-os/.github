import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

async function withServer(fn) {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test("health endpoint", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
  });
});

test("org connect creates ingestion job", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/orgs/org-1/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repositories: ["ubiquity-os/.github"] })
    });
    assert.equal(res.status, 202);
    const jobAck = await res.json();
    assert.equal(jobAck.status, "queued");

    const statusRes = await fetch(`${base}/ingestion/jobs/${jobAck.jobId}`);
    assert.equal(statusRes.status, 200);
    const status = await statusRes.json();
    assert.equal(status.orgId, "org-1");
  });
});

test("dashboard endpoints return payloads", async () => {
  await withServer(async (base) => {
    const cal = await fetch(`${base}/sprints/sprint-1/calendar`);
    assert.equal(cal.status, 200);
    const calJson = await cal.json();
    assert.ok(Array.isArray(calJson.days));

    const metrics = await fetch(`${base}/sprints/sprint-1/metrics`);
    assert.equal(metrics.status, 200);
    const m = await metrics.json();
    assert.equal(typeof m.salaryEquivalentSavingsUsd, "number");
  });
});
