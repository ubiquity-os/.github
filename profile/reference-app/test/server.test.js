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

async function createSession(base) {
  const res = await fetch(`${base}/auth/github/callback?code=abc&state=xyz`);
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie, "expected session cookie from callback");
  return cookie.split(";")[0];
}

test("health endpoint", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
  });
});

test("oauth start endpoint returns redirect", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/github/start`, { redirect: "manual" });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://github.com/login/oauth/authorize");
  });
});

test("org endpoints require session cookie", async () => {
  await withServer(async (base) => {
    const orgRes = await fetch(`${base}/orgs`);
    assert.equal(orgRes.status, 401);

    const connectRes = await fetch(`${base}/orgs/org-1/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repositories: ["ubiquity-os/.github"] })
    });
    assert.equal(connectRes.status, 401);
  });
});

test("org connect validates repositories and creates ingestion job", async () => {
  await withServer(async (base) => {
    const sessionCookie = await createSession(base);

    const invalidRes = await fetch(`${base}/orgs/org-1/connect`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ repositories: [] })
    });
    assert.equal(invalidRes.status, 400);

    const res = await fetch(`${base}/orgs/org-1/connect`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ repositories: ["ubiquity-os/.github"] })
    });
    assert.equal(res.status, 202);

    const jobAck = await res.json();
    assert.equal(jobAck.status, "queued");

    const statusRes = await fetch(`${base}/ingestion/jobs/${jobAck.jobId}`, {
      headers: { cookie: sessionCookie }
    });
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

test("oauth callback requires code and state query params", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/github/callback`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error, "Missing OAuth callback parameters");
  });
});

test("oauth callback returns non-sensitive session metadata", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/github/callback?code=abc&state=xyz`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.userId, "user-1");
    assert.equal(typeof json.expiresAt, "string");
    assert.equal("accessToken" in json, false);
    assert.ok(res.headers.get("set-cookie")?.includes("session="));
  });
});
