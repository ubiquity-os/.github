import http from "node:http";
import { randomUUID } from "node:crypto";
import { state } from "./state.js";

function send(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function match(pathname, pattern) {
  const a = pathname.split("/").filter(Boolean);
  const b = pattern.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (b[i].startsWith(":")) params[b[i].slice(1)] = a[i];
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const { pathname } = url;

    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true });
    }

    if (req.method === "GET" && pathname === "/auth/github/start") {
      return send(res, 200, { redirect: "https://github.com/login/oauth/authorize" });
    }

    if (req.method === "GET" && pathname === "/auth/github/callback") {
      return send(res, 200, {
        userId: "user-1",
        accessToken: "demo-token",
        expiresAt: new Date(Date.now() + 3600_000).toISOString()
      });
    }

    if (req.method === "GET" && pathname === "/orgs") {
      return send(res, 200, state.orgs);
    }

    const connectParams = match(pathname, "/orgs/:orgId/connect");
    if (req.method === "POST" && connectParams) {
      const body = await parseBody(req);
      const jobId = randomUUID();
      state.jobs.set(jobId, {
        jobId,
        orgId: connectParams.orgId,
        repositories: body.repositories || [],
        status: "queued",
        progress: 0,
        message: "Ingestion queued"
      });
      return send(res, 202, { jobId, status: "queued" });
    }

    const jobParams = match(pathname, "/ingestion/jobs/:jobId");
    if (req.method === "GET" && jobParams) {
      const job = state.jobs.get(jobParams.jobId);
      if (!job) return send(res, 404, { error: "Job not found" });
      return send(res, 200, job);
    }

    const calendarParams = match(pathname, "/sprints/:sprintId/calendar");
    if (req.method === "GET" && calendarParams) {
      const sprint = state.sprints.get(calendarParams.sprintId);
      if (!sprint) return send(res, 404, { error: "Sprint not found" });
      return send(res, 200, sprint.calendar);
    }

    const metricsParams = match(pathname, "/sprints/:sprintId/metrics");
    if (req.method === "GET" && metricsParams) {
      const sprint = state.sprints.get(metricsParams.sprintId);
      if (!sprint) return send(res, 404, { error: "Sprint not found" });
      return send(res, 200, sprint.metrics);
    }

    const itemParams = match(pathname, "/sprints/:sprintId/items/:itemId");
    if (req.method === "PATCH" && itemParams) {
      const sprint = state.sprints.get(itemParams.sprintId);
      if (!sprint) return send(res, 404, { error: "Sprint not found" });
      const body = await parseBody(req);
      sprint.overrides[itemParams.itemId] = { ...body, updatedAt: new Date().toISOString() };
      return send(res, 200, { ok: true, itemId: itemParams.itemId, override: sprint.overrides[itemParams.itemId] });
    }

    const replanParams = match(pathname, "/sprints/:sprintId/replan");
    if (req.method === "POST" && replanParams) {
      const sprint = state.sprints.get(replanParams.sprintId);
      if (!sprint) return send(res, 404, { error: "Sprint not found" });
      sprint.metrics.generatedAt = new Date().toISOString();
      return send(res, 200, { calendar: sprint.calendar, metrics: sprint.metrics, overrides: sprint.overrides });
    }

    return send(res, 404, { error: "Not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8787);
  createServer().listen(port, () => {
    console.log(`reference app listening on :${port}`);
  });
}
