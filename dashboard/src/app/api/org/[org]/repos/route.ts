import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";

export async function GET(
  request: NextRequest,
  { params }: { params: { org: string } }
) {
  const token = request.cookies.get("gh_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = new GitHubClient(token);
    const repos = await client.getOrgRepos(params.org);

    return NextResponse.json({
      org: params.org,
      total: repos.length,
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        open_issues_count: repo.open_issues_count,
        language: repo.language,
        updated_at: repo.updated_at,
        html_url: repo.html_url,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
