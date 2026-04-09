"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Metrics Panel — Time & cost savings display                        */
/* ------------------------------------------------------------------ */

interface MetricsPanelProps {
  totalTasks: number;
  assignedByAI: number;
}

interface Metrics {
  baseline: { totalTasks: number; assignedByAI: number; assignedManually: number };
  savings: { minutesSaved: number; hoursSaved: number; dollarsSaved: number };
  assumptions: { minutesPerManualAssignment: number; engManagerHourlyRate: number };
  projections: { backlogSize: number; manualHours: number; aiHours: number; savings: number }[];
}

export default function MetricsPanel({ totalTasks, assignedByAI }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!totalTasks) return;

    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalTasks, assignedByAI }),
    })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, [totalTasks, assignedByAI]);

  if (!totalTasks) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <span className="text-5xl mb-4">📊</span>
        <p className="text-lg">Import and assign tasks to see metrics.</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Minutes Saved"
          value={metrics.savings.minutesSaved.toLocaleString()}
          icon="⏱️"
          sub={`of ${metrics.baseline.totalTasks * metrics.assumptions.minutesPerManualAssignment} min manual`}
        />
        <MetricCard
          label="Hours Saved"
          value={metrics.savings.hoursSaved.toFixed(1)}
          icon="🕐"
          sub={`@ ${metrics.assumptions.minutesPerManualAssignment} min/task`}
        />
        <MetricCard
          label="Dollars Saved"
          value={`$${metrics.savings.dollarsSaved.toLocaleString()}`}
          icon="💰"
          sub={`@ $${metrics.assumptions.engManagerHourlyRate}/hr`}
        />
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold mb-4">Assignment Breakdown</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">AI Assigned</span>
              <span className="text-brand-400">{metrics.baseline.assignedByAI}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{
                  width: `${(metrics.baseline.assignedByAI / metrics.baseline.totalTasks) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Manual</span>
              <span className="text-amber-400">{metrics.baseline.assignedManually}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${(metrics.baseline.assignedManually / metrics.baseline.totalTasks) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scale projections */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-lg font-semibold mb-4">Savings at Scale</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="py-2 text-left">Backlog Size</th>
                <th className="py-2 text-right">Manual Hours</th>
                <th className="py-2 text-right">AI Hours</th>
                <th className="py-2 text-right">Savings</th>
              </tr>
            </thead>
            <tbody>
              {metrics.projections.map((row) => (
                <tr key={row.backlogSize} className="border-b border-gray-800/50">
                  <td className="py-2">{row.backlogSize} tasks</td>
                  <td className="py-2 text-right text-gray-400">{row.manualHours}h</td>
                  <td className="py-2 text-right text-brand-400">{row.aiHours}h</td>
                  <td className="py-2 text-right text-emerald-400 font-medium">
                    ${row.savings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions */}
      <div className="text-xs text-gray-600 text-center">
        Baseline: {metrics.assumptions.minutesPerManualAssignment} min/task manual assignment ·
        Engineering manager rate: ${metrics.assumptions.engManagerHourlyRate}/hr
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-center">
      <span className="text-2xl">{icon}</span>
      <div className="text-3xl font-bold mt-2 mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xs text-gray-600 mt-1">{sub}</div>
    </div>
  );
}
