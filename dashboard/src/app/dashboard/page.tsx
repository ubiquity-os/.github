"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { SprintCalendar } from "@/components/dashboard/sprint-calendar";
import { TaskBoard } from "@/components/dashboard/task-board";
import { TeamView } from "@/components/dashboard/team-view";
import { PrioritySwiper } from "@/components/dashboard/priority-swiper";
import { getDemoSprint, getDemoMetrics } from "@/lib/demo-data";
import { SprintTask, Priority, ROIMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Target,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type View = "overview" | "calendar" | "board" | "team" | "metrics" | "prioritize";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [sprint, setSprint] = useState(() => getDemoSprint());
  const [metrics] = useState<ROIMetrics>(() => getDemoMetrics());

  const handleUpdateTask = useCallback(
    (taskId: string, updates: Partial<SprintTask>) => {
      setSprint((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }));
    },
    []
  );

  const handlePrioritySet = useCallback(
    (taskId: string, priority: Priority) => {
      handleUpdateTask(taskId, { priority });
    },
    [handleUpdateTask]
  );

  const sprintProgress = Math.round(
    (sprint.tasks.filter((t) => t.status === "done" || t.status === "in_progress")
      .length /
      sprint.tasks.length) *
      100
  );

  const totalEstimatedHours = sprint.tasks.reduce(
    (sum, t) => sum + t.estimated_hours,
    0
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{sprint.name}</h1>
            <p className="text-sm text-zinc-500">
              {new Date(sprint.start_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(sprint.end_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-zinc-400">Sprint Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={sprintProgress} className="w-32" />
                <span className="text-sm font-mono text-violet-400">
                  {sprintProgress}%
                </span>
              </div>
            </div>
            <Badge variant="default" className="px-3 py-1.5">
              {sprint.tasks.length} tasks &middot; {totalEstimatedHours}h
            </Badge>
          </div>
        </div>

        {/* Views */}
        {activeView === "overview" && (
          <div className="space-y-6">
            <MetricsCards metrics={metrics} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SprintCalendar sprint={sprint} />
              </div>
              <div>
                <TeamView team={sprint.team} tasks={sprint.tasks} />
              </div>
            </div>
          </div>
        )}

        {activeView === "calendar" && (
          <SprintCalendar sprint={sprint} />
        )}

        {activeView === "board" && (
          <TaskBoard tasks={sprint.tasks} onUpdateTask={handleUpdateTask} />
        )}

        {activeView === "team" && (
          <TeamView team={sprint.team} tasks={sprint.tasks} />
        )}

        {activeView === "prioritize" && (
          <div className="max-w-2xl mx-auto">
            <PrioritySwiper
              tasks={sprint.tasks}
              onPrioritySet={handlePrioritySet}
            />
          </div>
        )}

        {activeView === "metrics" && (
          <div className="space-y-6">
            <MetricsCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed ROI breakdown */}
              <Card className="border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                    ROI Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        Task Assignment Automation
                      </span>
                      <span className="text-sm font-mono text-white">
                        {metrics.hours_saved_assignment}h saved
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.hours_saved_assignment /
                          metrics.total_hours_saved) *
                        100
                      }
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        Sprint Planning Automation
                      </span>
                      <span className="text-sm font-mono text-white">
                        {metrics.hours_saved_planning}h saved
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.hours_saved_planning /
                          metrics.total_hours_saved) *
                        100
                      }
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        Priority Analysis
                      </span>
                      <span className="text-sm font-mono text-white">
                        {(
                          metrics.total_hours_saved -
                          metrics.hours_saved_assignment -
                          metrics.hours_saved_planning
                        ).toFixed(1)}
                        h saved
                      </span>
                    </div>
                    <Progress
                      value={
                        ((metrics.total_hours_saved -
                          metrics.hours_saved_assignment -
                          metrics.hours_saved_planning) /
                          metrics.total_hours_saved) *
                        100
                      }
                    />
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">
                        Total Time Saved per Sprint
                      </span>
                      <span className="text-lg font-bold text-violet-400">
                        {metrics.total_hours_saved}h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial impact */}
              <Card className="border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Financial Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">
                        Manager Rate
                      </p>
                      <p className="text-xl font-bold text-white">
                        ${metrics.manager_hourly_rate}/hr
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">
                        Sprints/Month
                      </p>
                      <p className="text-xl font-bold text-white">2</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs text-zinc-500 mb-1">
                        Monthly Savings
                      </p>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(metrics.cost_savings_monthly)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs text-zinc-500 mb-1">
                        Annual Savings
                      </p>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(metrics.cost_savings_annual)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>
                        Savings scale linearly with backlog size.{" "}
                        <span className="text-emerald-400 font-medium">
                          Larger teams save more.
                        </span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task analysis summary */}
              <Card className="border-zinc-800 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Sprint Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Issues Analyzed",
                        value: metrics.tasks_analyzed,
                        icon: Layers,
                        color: "text-violet-400",
                      },
                      {
                        label: "Auto-Prioritized",
                        value: metrics.tasks_auto_prioritized,
                        icon: Target,
                        color: "text-amber-400",
                      },
                      {
                        label: "Efficiency Gain",
                        value: `+${metrics.efficiency_gain_percent}%`,
                        icon: TrendingUp,
                        color: "text-emerald-400",
                      },
                      {
                        label: "Plans Generated",
                        value: metrics.sprint_plans_generated,
                        icon: CheckCircle2,
                        color: "text-blue-400",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30"
                      >
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <div>
                          <p className="text-xl font-bold text-white">
                            {stat.value}
                          </p>
                          <p className="text-xs text-zinc-500">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
