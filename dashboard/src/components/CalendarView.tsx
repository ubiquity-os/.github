"use client";

import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Calendar View — Team members × Days grid with task assignments     */
/* ------------------------------------------------------------------ */

interface CalendarProps {
  tasks: TaskItem[];
  members: TeamMember[];
  assignments: Record<string, string[]>;
}

interface TaskItem {
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function CalendarView({ tasks, members, assignments }: CalendarProps) {
  /* Build a map: taskId → task */
  const taskMap = useMemo(() => {
    const m = new Map<string, TaskItem>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  /* Distribute tasks across days for each member */
  const schedule = useMemo(() => {
    const grid: Record<string, Record<string, TaskItem[]>> = {};
    for (const member of members) {
      const memberTasks = (assignments[member.login] ?? [])
        .map((id) => taskMap.get(id))
        .filter(Boolean) as TaskItem[];

      grid[member.login] = {};
      DAYS.forEach((_, i) => (grid[member.login][DAYS[i]] = []));

      memberTasks.forEach((task, i) => {
        const day = DAYS[i % DAYS.length];
        grid[member.login][day].push(task);
      });
    }
    return grid;
  }, [assignments, members, taskMap]);

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-lg">No tasks yet. Import tasks from the sidebar to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-950 w-40 text-left p-3 text-sm text-gray-400 font-medium">
              Team
            </th>
            {DAYS.map((day) => (
              <th key={day} className="p-3 text-sm text-gray-400 font-medium text-left min-w-[200px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.login} className="border-t border-gray-800/50">
              <td className="sticky left-0 z-10 bg-gray-950 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold uppercase">
                    {member.login[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{member.login}</div>
                    <div className="text-xs text-gray-500">
                      {member.availability === "partial" && "⏰ partial"}
                    </div>
                  </div>
                </div>
              </td>
              {DAYS.map((day) => (
                <td key={day} className="p-2 align-top">
                  <div className="flex flex-col gap-1.5">
                    {(schedule[member.login]?.[day] ?? []).map((task) => (
                      <a
                        key={task.id}
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-lg p-2 text-xs transition hover:scale-[1.02] border ${priorityStyles[task.priority]}`}
                      >
                        <div className="font-medium truncate">#{task.number} {task.title}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{task.repo}</div>
                      </a>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-900/30 border-emerald-800/50 text-emerald-200",
  high: "bg-amber-900/30 border-amber-800/50 text-amber-200",
  urgent: "bg-red-900/30 border-red-800/50 text-red-200",
};
