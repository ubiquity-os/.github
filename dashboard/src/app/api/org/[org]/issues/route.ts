import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";
import { issuesToSprintTasks } from "@/lib/sprint-planner";

export async function GET(
  request: NextRequest,
  { params }: { params: { org: string } }
) {
  const token = request.cookies.get("gh_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const repos = searchParams.get("repos")?.split(",").filter(Boolean);

  try {
    const client = new GitHubClient(token);
    const issues = await client.getOrgIssues(params.org, repos || undefined);
    const tasks = issuesToSprintTasks(issues);

    return NextResponse.json({
      org: params.org,
      total_issues: issues.length,
      tasks,
      summary: {
        urgent: tasks.filter((t) => t.priority === "urgent").length,
        high: tasks.filter((t) => t.priority === "high").length,
        medium: tasks.filter((t) => t.priority === "medium").length,
        low: tasks.filter((t) => t.priority === "low").length,
        total_estimated_hours: tasks.reduce(
          (sum, t) => sum + t.estimated_hours,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
