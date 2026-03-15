"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Sprint, SprintTask, TeamMember, Priority } from "@/types";

interface SprintCalendarProps {
  sprint: Sprint;
}

function getSprintDays(start: string, end: string): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function TaskPill({ task }: { task: SprintTask }) {
  const colorMap: Record<Priority, string> = {
    urgent: "bg-red-500/20 border-red-500/30 text-red-300",
    high: "bg-orange-500/20 border-orange-500/30 text-orange-300",
    medium: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    low: "bg-zinc-500/20 border-zinc-500/30 text-zinc-300",
  };

  return (
    <a
      href={task.issue_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block px-2 py-1.5 rounded-md border text-xs truncate hover:brightness-125 transition-all ${colorMap[task.priority]}`}
      title={`${task.title} (${task.estimated_hours}h)`}
    >
      <span className="font-medium">{task.title}</span>
      <span className="text-[10px] opacity-70 ml-1">
        {task.estimated_hours}h
      </span>
    </a>
  );
}

export function SprintCalendar({ sprint }: SprintCalendarProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  const sprintDays = useMemo(
    () => getSprintDays(sprint.start_date, sprint.end_date),
    [sprint.start_date, sprint.end_date]
  );

  const visibleDays = useMemo(() => {
    if (view === "week") {
      const start = weekOffset * 5;
      return sprintDays.slice(start, start + 5);
    }
    return sprintDays;
  }, [sprintDays, view, weekOffset]);

  const totalWeeks = Math.ceil(sprintDays.length / 5);

  // Group tasks by assignee and sprint day
  const tasksByMemberAndDay = useMemo(() => {
    const map = new Map<string, Map<number, SprintTask[]>>();

    for (const member of sprint.team) {
      map.set(member.id, new Map());
    }

    // Also add an "Unassigned" row
    map.set("unassigned", new Map());

    for (const task of sprint.tasks) {
      const memberId = task.assignee?.id || "unassigned";
      if (!map.has(memberId)) {
        map.set(memberId, new Map());
      }
      const memberMap = map.get(memberId)!;
      const day = task.sprint_day || 1;
      if (!memberMap.has(day)) {
        memberMap.set(day, []);
      }
      memberMap.get(day)!.push(task);
    }

    return map;
  }, [sprint.tasks, sprint.team]);

  const allMembers: (TeamMember | { id: string; login: string; name: string; avatar_url: string })[] = [
    ...sprint.team,
    { id: "unassigned", login: "unassigned", name: "Unassigned", avatar_url: "" },
  ];

  return (
    <Card className="border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <CalIcon className="w-5 h-5 text-violet-400" />
          <CardTitle className="text-lg">{sprint.name} Calendar</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none text-xs"
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none text-xs"
              onClick={() => setView("month")}
            >
              Full Sprint
            </Button>
          </div>
          {view === "week" && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-zinc-400 w-20 text-center">
                Week {weekOffset + 1} of {totalWeeks}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setWeekOffset(Math.min(totalWeeks - 1, weekOffset + 1))
                }
                disabled={weekOffset >= totalWeeks - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-zinc-500 font-medium py-2 px-3 w-40 sticky left-0 bg-zinc-900/90 backdrop-blur-sm z-10">
                  Team Member
                </th>
                {visibleDays.map((day, i) => (
                  <th
                    key={i}
                    className="text-center text-xs text-zinc-500 font-medium py-2 px-2 min-w-[140px]"
                  >
                    <div>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-zinc-600">
                      {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allMembers.map((member) => {
                const memberTasks = tasksByMemberAndDay.get(member.id);
                const hasAnyTasks = memberTasks && memberTasks.size > 0;
                if (member.id === "unassigned" && !hasAnyTasks) return null;

                return (
                  <tr key={member.id} className="border-t border-zinc-800/50">
                    <td className="py-2 px-3 sticky left-0 bg-zinc-900/90 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-2">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.login}
                            className="w-6 h-6 rounded-full border border-zinc-700"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                            ?
                          </div>
                        )}
                        <span className="text-sm text-zinc-300 truncate">
                          {member.login}
                        </span>
                      </div>
                    </td>
                    {visibleDays.map((_, dayIdx) => {
                      const globalDay =
                        view === "week" ? weekOffset * 5 + dayIdx + 1 : dayIdx + 1;
                      const dayTasks = memberTasks?.get(globalDay) || [];

                      return (
                        <td
                          key={dayIdx}
                          className="py-2 px-2 align-top"
                        >
                          <div className="space-y-1 min-h-[60px]">
                            {dayTasks.map((task) => (
                              <TaskPill key={task.id} task={task} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">Priority:</span>
          {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
            <Badge key={p} variant={p}>
              {p}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
