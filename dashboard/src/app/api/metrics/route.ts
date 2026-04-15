import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/metrics
 * Body: { totalTasks: number, assignedByAI: number }
 *
 * Calculates time & cost savings from automated sprint assignment.
 */
export async function POST(req: NextRequest) {
  let body: { totalTasks: number; assignedByAI: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { totalTasks, assignedByAI } = body;

  if (
    typeof totalTasks !== "number" ||
    typeof assignedByAI !== "number" ||
    !Number.isFinite(totalTasks) ||
    !Number.isFinite(assignedByAI) ||
    totalTasks < 0 ||
    assignedByAI < 0 ||
    assignedByAI > totalTasks
  ) {
    return NextResponse.json(
      { error: "totalTasks and assignedByAI must be non-negative finite numbers with assignedByAI <= totalTasks" },
      { status: 400 }
    );
  }

  const minutesPerTask = Number(process.env.MINUTES_PER_MANUAL_ASSIGNMENT) || 5;
  const hourlyRate = Number(process.env.ENG_MANAGER_HOURLY_RATE) || 75;

  const manualMinutes = totalTasks * minutesPerTask;
  const aiMinutes = (totalTasks - assignedByAI) * minutesPerTask;
  const minutesSaved = manualMinutes - aiMinutes;
  const hoursSaved = minutesSaved / 60;
  const dollarsSaved = Math.round(hoursSaved * hourlyRate);

  // Scale projection: what if the backlog grows?
  const projections = [50, 100, 250, 500, 1000].map((size) => {
    const h = (size * minutesPerTask) / 60;
    return {
      backlogSize: size,
      manualHours: h,
      aiHours: Math.round(h * 0.1 * 10) / 10, // AI reduces assignment time by ~90%
      savings: Math.round(h * 0.9 * hourlyRate),
    };
  });

  return NextResponse.json({
    baseline: {
      totalTasks,
      assignedByAI,
      assignedManually: totalTasks - assignedByAI,
    },
    savings: {
      minutesSaved,
      hoursSaved: Math.round(hoursSaved * 100) / 100,
      dollarsSaved,
    },
    assumptions: {
      minutesPerManualAssignment: minutesPerTask,
      engManagerHourlyRate: hourlyRate,
    },
    projections,
  });
}
