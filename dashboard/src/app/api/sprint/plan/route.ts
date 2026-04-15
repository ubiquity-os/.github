import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/sprint/plan
 * Body: { tasks, members }
 *
 * Uses an OpenAI-compatible API to generate sprint assignments.
 * Falls back to round-robin if no API key is configured.
 */
export async function POST(req: NextRequest) {
  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tasks?: SprintTask[]; members?: TeamMember[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tasks, members } = body;

  if (!tasks?.length || !members?.length) {
    return NextResponse.json({ error: "tasks and members are required" }, { status: 400 });
  }

  // If no AI key, use heuristic assignment
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(heuristicAssign(tasks, members));
  }

  try {
    const prompt = buildPrompt(tasks, members);
    const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`AI API returned ${res.status}`);
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices[0].message.content);
    const assignments = raw.plan ?? raw;

    // Validate model output: only known members and task IDs
    const memberSet = new Set(members.map((m) => m.login));
    const taskSet = new Set(tasks.map((t) => t.id));
    const validated: Record<string, string[]> = {};

    for (const [member, taskIds] of Object.entries(assignments)) {
      if (!memberSet.has(member)) continue;
      validated[member] = (taskIds as string[]).filter((id: string) => taskSet.has(id));
    }

    // Ensure all members have an entry
    for (const m of members) {
      if (!validated[m.login]) validated[m.login] = [];
    }

    return NextResponse.json({
      assignments: validated,
      method: "ai",
    });
  } catch {
    return NextResponse.json(heuristicAssign(tasks, members));
  }
}

/* ------------------------------------------------------------------ */
/* Heuristic fallback — round-robin with label-based affinity scoring  */
/* ------------------------------------------------------------------ */
function heuristicAssign(tasks: SprintTask[], members: TeamMember[]) {
  const assignments: Record<string, string[]> = {};
  members.forEach((m) => (assignments[m.login] = []));

  // Sort tasks by priority weight (urgent > high > low)
  const priorityWeight: Record<string, number> = { urgent: 3, high: 2, low: 1 };
  const sorted = [...tasks].sort(
    (a, b) => (priorityWeight[b.priority] ?? 1) - (priorityWeight[a.priority] ?? 1)
  );

  let idx = 0;
  for (const task of sorted) {
    // Find best-fit member by matching labels to skills
    let bestIdx = idx % members.length;
    let bestScore = 0;

    members.forEach((m, i) => {
      const score = m.skills?.filter((s) => task.labels.includes(s)).length ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });

    const member = members[bestScore > 0 ? bestIdx : idx % members.length];
    assignments[member.login].push(task.id);
    idx++;
  }

  return { assignments, method: "heuristic" };
}

function buildPrompt(tasks: SprintTask[], members: TeamMember[]): string {
  return `You are a sprint planning assistant. Assign tasks to team members optimally.

TEAM MEMBERS:
${members.map((m) => `- ${m.login}: skills=[${m.skills?.join(", ") ?? "general"}], availability=${m.availability ?? "full"}`).join("\n")}

TASKS:
${tasks.map((t) => `- [#${t.number}] ${t.title} | repo=${t.repo} | labels=[${t.labels.join(", ")}] | priority=${t.priority}`).join("\n")}

Return JSON: { "plan": { "<member_login>": ["<task_id>", ...], ... } }
Balance workload. Match skills to labels. Respect priority (urgent first).`;
}

interface SprintTask {
  id: string;
  number: number;
  title: string;
  repo: string;
  labels: string[];
  priority: string;
}

interface TeamMember {
  login: string;
  skills?: string[];
  availability?: string;
}
