"use client";

import {
  Calendar,
  Brain,
  Users,
  BarChart3,
  GitBranch,
  Shield,
  Layers,
  Target,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "GitHub Native",
    description:
      "Connect your org with one click. We scan repos, issues, PRs, and team members automatically.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Brain,
    title: "AI Task Estimation",
    description:
      "Reads issue specs, labels, and complexity signals to estimate hours with surprising accuracy.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Calendar,
    title: "Sprint Calendar",
    description:
      "Visual calendar showing who works on what and when. Drag tasks to reassign or reschedule.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Target,
    title: "Smart Prioritization",
    description:
      "AI identifies revenue-driving tasks vs. nice-to-haves. Override with a swipe to fine-tune.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Auto-Assignment",
    description:
      "Matches tasks to team members based on skills, current load, and historical performance.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "ROI Dashboard",
    description:
      "Real numbers: hours saved, dollars saved, efficiency gains. Justify the tool to leadership instantly.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Layers,
    title: "Multi-Platform Import",
    description:
      "Pull tasks from GitHub, and soon Asana, Linear, and Jira. One unified sprint view.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Read-only GitHub access. No code is stored. Your data stays yours. SOC 2 roadmap planned.",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
];

export function Features() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything your sprint needs
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            From backlog analysis to ROI reporting, every feature is designed
            to make engineering managers faster and more effective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.bg} mb-4`}
              >
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
