"use client";

import { useState, useCallback } from "react";
import CalendarView from "@/components/CalendarView";
import PrioritySwiper from "@/components/PrioritySwiper";
import MetricsPanel from "@/components/MetricsPanel";
import TaskImport from "@/components/TaskImport";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface Task {
  id: string;
  number: number;
  title: string;
  repo: string;
  labels: string[];
  priority: "low" | "high" | "urgent";
  assignee: string | null;
  url: string;
}

interface TeamMember {
  login: string;
  avatar: string;
  skills: string[];
  availability: "full" | "partial" | "off";
}

/* ------------------------------------------------------------------ */
/* Sprint Dashboard Page                                              */
/* ------------------------------------------------------------------ */
export default function SprintDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members] = useState<TeamMember[]>([
    { login: "alice", avatar: "", skills: ["frontend", "react", "css"], availability: "full" },
    { login: "bob", avatar: "", skills: ["backend", "node", "database"], availability: "full" },
    { login: "carol", avatar: "", skills: ["devops", "ci", "docker"], availability: "partial" },
    { login: "dave", avatar: "", skills: ["frontend", "testing", "react"], availability: "full" },
    { login: "eve", avatar: "", skills: ["backend", "api", "security"], availability: "full" },
  ]);
  const [sprintAssignments, setSprintAssignments] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<"calendar" | "prioritize" | "metrics">("calendar");
  const [syncing, setSyncing] = useState(false);
  const [planning, setPlanning] = useState(false);

  /* ---- Import tasks from GitHub org ---- */
  const handleImport = useCallback(async (org: string, token: string) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/org/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Sync failed: ${res.status}`);
      }
      const data = await res.json();

      const imported: Task[] = (data.tasks ?? []).map((t: any) => ({
        id: String(t.id),
        number: t.number,
        title: t.title,
        repo: t.repo,
        labels: t.labels,
        priority: inferPriority(t.labels),
        assignee: t.assignee,
        url: t.url,
      }));

      setTasks((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...imported.filter((t) => !existing.has(t.id))];
      });
    } finally {
      setSyncing(false);
    }
  }, []);

  /* ---- AI Sprint Planning ---- */
  const handlePlan = useCallback(async () => {
    if (!tasks.length) return;
    setPlanning(true);
    try {
      const res = await fetch("/api/sprint/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, members }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Planning failed: ${res.status}`);
      }
      const data = await res.json();
      setSprintAssignments(data.assignments);
    } finally {
      setPlanning(false);
    }
  }, [tasks, members]);

  /* ---- Update task priority ---- */
  const setPriority = useCallback((taskId: string, priority: Task["priority"]) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority } : t)));
  }, []);

  /* ---- Metrics computation ---- */
  const assignedByAI = Object.values(sprintAssignments).flat().length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
              Sprint Dashboard
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {tasks.length} tasks · {members.length} members
            </span>
            <button
              onClick={handlePlan}
              disabled={planning || !tasks.length}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition"
            >
              {planning ? "Planning..." : "🧠 AI Plan Sprint"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left sidebar — Task Import */}
        <aside className="w-72 shrink-0">
          <TaskImport onImport={handleImport} syncing={syncing} taskCount={tasks.length} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Tabs */}
          <nav className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
            {(["calendar", "prioritize", "metrics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === tab
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab === "calendar" && "📅 Calendar"}
                {tab === "prioritize" && "🎯 Prioritize"}
                {tab === "metrics" && "📊 Metrics"}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          {activeTab === "calendar" && (
            <CalendarView tasks={tasks} members={members} assignments={sprintAssignments} />
          )}
          {activeTab === "prioritize" && (
            <PrioritySwiper tasks={tasks} onSetPriority={setPriority} />
          )}
          {activeTab === "metrics" && (
            <MetricsPanel totalTasks={tasks.length} assignedByAI={assignedByAI} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function inferPriority(labels: string[]): Task["priority"] {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes("urgent") || l.includes("critical") || l.includes("p0"))) return "urgent";
  if (lower.some((l) => l.includes("high") || l.includes("important") || l.includes("p1"))) return "high";
  return "low";
}
