import http from "node:http";
import { randomUUID } from "node:crypto";
import { state } from "./state.js";

function send(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [rawKey, ...rawValue] = part.split("=");
      if (!rawKey || !rawValue.length) return acc;
      acc[rawKey] = decodeURIComponent(rawValue.join("="));
      return acc;
    }, {});
}

function requireSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const sessionId = cookies.session;
  if (!sessionId) {
    send(res, 401, { error: "Unauthorized" });
    return null;
  }

  const session = state.sessions.get(sessionId);
  if (!session || session.expiresAtMs <= Date.now()) {
    state.sessions.delete(sessionId);
    send(res, 401, { error: "Unauthorized" });
    return null;
  }

  return session;
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
      return redirect(res, "https://github.com/login/oauth/authorize");
    }

    if (req.method === "GET" && pathname === "/auth/github/callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      if (!code || !stateParam) {
        return send(res, 400, { error: "Missing OAuth callback parameters" });
      }

      const sessionId = randomUUID();
      const expiresAtMs = Date.now() + 3600_000;
      const expiresAt = new Date(expiresAtMs).toISOString();
      state.sessions.set(sessionId, { userId: "user-1", expiresAtMs });

      res.writeHead(200, {
        "content-type": "application/json",
        "set-cookie": `session=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`
      });
      return res.end(JSON.stringify({ userId: "user-1", expiresAt }));
    }

    if (req.method === "GET" && pathname === "/orgs") {
      if (!requireSession(req, res)) return;
      return send(res, 200, state.orgs);
    }

    const connectParams = match(pathname, "/orgs/:orgId/connect");
    if (req.method === "POST" && connectParams) {
      if (!requireSession(req, res)) return;

      const body = await parseBody(req);
      const repositories = body?.repositories;
      const invalidRepositories =
        !Array.isArray(repositories) ||
        repositories.length === 0 ||
        repositories.some((repo) => typeof repo !== "string" || !repo.trim());

      if (invalidRepositories) {
        return send(res, 400, { error: "Invalid repositories payload: expected non-empty string array" });
      }

      const jobId = randomUUID();
      state.jobs.set(jobId, {
        jobId,
        orgId: connectParams.orgId,
        repositories,
        status: "queued",
        progress: 0,
        message: "Ingestion queued"
      });
      return send(res, 202, { jobId, status: "queued" });
    }

    const jobParams = match(pathname, "/ingestion/jobs/:jobId");
    if (req.method === "GET" && jobParams) {
      if (!requireSession(req, res)) return;

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
