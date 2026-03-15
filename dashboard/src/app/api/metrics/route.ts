import { NextRequest, NextResponse } from "next/server";
import { calculateROI } from "@/lib/sprint-planner";
import { getDemoMetrics } from "@/lib/demo-data";
import { SprintTask } from "@/types";

export async function GET() {
  // Return demo metrics for unauthenticated requests
  const metrics = getDemoMetrics();

  return NextResponse.json({
    metrics,
    explanation: {
      methodology:
        "ROI is calculated based on average engineering manager time spent on task assignment (5 min/task), prioritization (3 min/task), and sprint planning (15 min/task), multiplied by the industry-average manager hourly rate.",
      assumptions: {
        manager_hourly_rate: 85,
        minutes_per_task_assignment: 5,
        minutes_per_prioritization: 3,
        minutes_per_sprint_planning: 15,
        sprints_per_month: 2,
      },
      scaling_note:
        "Savings increase linearly with backlog size. A 500-issue backlog saves ~10x more than a 50-issue backlog.",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, team_size = 5 } = body;

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Tasks array is required" },
        { status: 400 }
      );
    }

    const metrics = calculateROI(tasks as SprintTask[], team_size);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Metrics calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
