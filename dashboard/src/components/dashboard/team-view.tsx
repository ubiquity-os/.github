"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { TeamMember, SprintTask } from "@/types";

interface TeamViewProps {
  team: TeamMember[];
  tasks: SprintTask[];
}

export function TeamView({ team, tasks }: TeamViewProps) {
  const getMemberTasks = (memberId: string) =>
    tasks.filter((t) => t.assignee?.id === memberId);

  const getMemberLoad = (memberId: string) => {
    const memberTasks = getMemberTasks(memberId);
    return memberTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  };

  return (
    <Card className="border-zinc-800">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <Users className="w-5 h-5 text-violet-400" />
        <CardTitle className="text-lg">Team Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.map((member) => {
            const memberTasks = getMemberTasks(member.id);
            const load = getMemberLoad(member.id);
            const capacity = member.capacity_hours;
            const utilization = Math.min((load / capacity) * 100, 100);

            let utilizationColor = "text-emerald-400";
            if (utilization > 90) utilizationColor = "text-red-400";
            else if (utilization > 75) utilizationColor = "text-amber-400";

            return (
              <div
                key={member.id}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar_url}
                      alt={member.login}
                      className="w-10 h-10 rounded-full border-2 border-zinc-700"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {member.name}
                      </h4>
                      <p className="text-xs text-zinc-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono ${utilizationColor}`}>
                      {load}h / {capacity}h
                    </p>
                    <p className="text-xs text-zinc-500">
                      {memberTasks.length} tasks
                    </p>
                  </div>
                </div>

                <Progress value={utilization} className="mb-3" />

                <div className="flex flex-wrap gap-1.5">
                  {memberTasks.slice(0, 4).map((task) => (
                    <Badge
                      key={task.id}
                      variant={task.priority}
                      className="text-[10px] max-w-[180px] truncate"
                    >
                      {task.title}
                    </Badge>
                  ))}
                  {memberTasks.length > 4 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{memberTasks.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
