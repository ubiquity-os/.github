import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";
import {
  issuesToSprintTasks,
  membersToTeam,
  generateSprint,
  calculateROI,
} from "@/lib/sprint-planner";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("gh_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { org, repos, sprint_length_days = 10, team_size } = body;

    if (!org) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    const client = new GitHubClient(token);

    // Fetch issues and members in parallel
    const [issues, members] = await Promise.all([
      client.getOrgIssues(org, repos),
      client.getOrgMembers(org).catch(() => []),
    ]);

    const tasks = issuesToSprintTasks(issues);
    const team = membersToTeam(members);

    // Limit team size if specified
    const activeTeam = team_size ? team.slice(0, team_size) : team;

    const sprint = generateSprint(tasks, activeTeam, sprint_length_days);
    const metrics = calculateROI(tasks, activeTeam.length || 1);

    return NextResponse.json({
      sprint,
      metrics,
      meta: {
        issues_scanned: issues.length,
        repos_scanned: repos?.length || "all",
        team_members: activeTeam.length,
        sprint_days: sprint_length_days,
      },
    });
  } catch (error) {
    console.error("Sprint planning error:", error);
    return NextResponse.json(
      { error: "Failed to generate sprint plan" },
      { status: 500 }
    );
  }
}
