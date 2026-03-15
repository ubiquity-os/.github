"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ROICalculator() {
  const [teamSize, setTeamSize] = useState(8);
  const [backlogSize, setBacklogSize] = useState(50);
  const [sprintsPerMonth, setSprintsPerMonth] = useState(2);

  const managerRate = 85;
  const minutesPerTask = 5;
  const minutesPerPrioritization = 3;
  const minutesPerPlanning = 15;

  const hoursPerSprint =
    (backlogSize * (minutesPerTask + minutesPerPrioritization + minutesPerPlanning)) / 60;
  const monthlyHours = hoursPerSprint * sprintsPerMonth;
  const monthlySavings = monthlyHours * managerRate;
  const annualSavings = monthlySavings * 12;
  const efficiencyGain = Math.min(
    ((hoursPerSprint * sprintsPerMonth) / (teamSize * 160)) * 100,
    95
  );

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Calculate Your ROI
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            See exactly how much time and money UbiquityOS Sprint Manager saves
            your team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <Card className="border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Your Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">Team Size</label>
                  <span className="text-sm font-mono text-violet-400">
                    {teamSize} engineers
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>2</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">
                    Open Issues / Backlog Size
                  </label>
                  <span className="text-sm font-mono text-violet-400">
                    {backlogSize} issues
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={backlogSize}
                  onChange={(e) => setBacklogSize(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">
                    Sprints per Month
                  </label>
                  <span className="text-sm font-mono text-violet-400">
                    {sprintsPerMonth}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={sprintsPerMonth}
                  onChange={(e) => setSprintsPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>1</span>
                  <span>4</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Based on avg engineering manager rate of $85/hr. Includes time
                  for task assignment (5 min/task), prioritization (3 min/task),
                  and sprint planning (15 min/task).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="border-zinc-800 glow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Annual Savings</p>
                    <p className="text-4xl font-bold text-emerald-400">
                      {formatCurrency(annualSavings)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-zinc-400">Hours/Sprint</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {hoursPerSprint.toFixed(1)}h
                  </p>
                </CardContent>
              </Card>

              <Card className="border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Monthly</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(monthlySavings)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-zinc-400">Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    +{efficiencyGain.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-zinc-400">Tasks/Sprint</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{backlogSize}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
