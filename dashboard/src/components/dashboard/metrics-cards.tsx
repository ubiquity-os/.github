"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { ROIMetrics } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface MetricsCardsProps {
  metrics: ROIMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Hours Saved",
      value: `${metrics.total_hours_saved}h`,
      subtitle: "per sprint cycle",
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      change: `${metrics.hours_saved_planning}h planning + ${metrics.hours_saved_assignment}h assignment`,
    },
    {
      title: "Monthly Savings",
      value: formatCurrency(metrics.cost_savings_monthly),
      subtitle: `at $${metrics.manager_hourly_rate}/hr manager rate`,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      change: `${formatCurrency(metrics.cost_savings_annual)}/yr`,
    },
    {
      title: "Efficiency Gain",
      value: `+${metrics.efficiency_gain_percent}%`,
      subtitle: "sprint planning efficiency",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      change: `${metrics.tasks_auto_prioritized} tasks auto-prioritized`,
    },
    {
      title: "Tasks Analyzed",
      value: metrics.tasks_analyzed.toString(),
      subtitle: "issues processed by AI",
      icon: CheckCircle2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      change: `${metrics.sprint_plans_generated} sprint plan generated`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-zinc-400">{card.title}</p>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
