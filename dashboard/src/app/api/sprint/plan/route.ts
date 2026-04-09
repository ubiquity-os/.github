import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sprint/plan
 * Body: { tasks, members }
 *
 * Uses an OpenAI-compatible API to generate sprint assignments.
 * Falls back to round-robin if no API key is configured.
 */
export async function POST(req: NextRequest) {
  const { tasks, members } = (await req.json()) as {
    tasks: SprintTask[];
    members: TeamMember[];
  };

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
    });

    if (!res.ok) {
      throw new Error(`AI API returned ${res.status}`);
    }

    const data = await res.json();
    const assignments = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      assignments: assignments.plan ?? assignments,
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
