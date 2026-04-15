import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

/**
 * POST /api/org/sync
 * Body: { org: string, accessToken: string }
 * Scrapes all repos + open issues from a GitHub org and returns them.
 */
export async function POST(req: NextRequest) {
  let body: { org?: string; accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org, accessToken } = body;

  if (!org || !accessToken) {
    return NextResponse.json({ error: "org and accessToken are required" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: accessToken });

  try {
    // Fetch org repos (paginated)
    const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
      org,
      per_page: 100,
      sort: "updated",
    });

    // Fetch open issues for each repo (top 30 per repo to stay within rate limits)
    const tasks: Task[] = [];
    const failedRepos: string[] = [];
    for (const repo of repos) {
      try {
        const { data: issues } = await octokit.rest.issues.listForRepo({
          owner: org,
          repo: repo.name,
          state: "open",
          per_page: 30,
        });

        for (const issue of issues) {
          // Skip pull requests (they show up in the issues endpoint)
          if (issue.pull_request) continue;

          tasks.push({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body ?? "",
            url: issue.html_url,
            repo: repo.name,
            labels: issue.labels.map((l: any) => (typeof l === "string" ? l : l.name)),
            assignee: issue.assignee?.login ?? null,
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
          });
        }
      } catch {
        failedRepos.push(repo.name);
      }
    }

    return NextResponse.json({
      org,
      repoCount: repos.length,
      tasks,
      warnings: failedRepos.length
        ? { failedRepos, failedCount: failedRepos.length }
        : undefined,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to sync org" },
      { status: 500 }
    );
  }
}

export interface Task {
  id: number;
  number: number;
  title: string;
  body: string;
  url: string;
  repo: string;
  labels: string[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}
