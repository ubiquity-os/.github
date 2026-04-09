"use client";

import { useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/* Priority Swiper — Tinder-like card interface for task prioritization */
/* ------------------------------------------------------------------ */

interface PrioritySwiperProps {
  tasks: TaskItem[];
  onSetPriority: (taskId: string, priority: "low" | "high" | "urgent") => void;
}

interface TaskItem {
  id: string;
  number: number;
  title: string;
  repo: string;
  labels: string[];
  priority: "low" | "high" | "urgent";
  url: string;
}

export default function PrioritySwiper({ tasks, onSetPriority }: PrioritySwiperProps) {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<"left" | "right" | null>(null);

  const task = tasks[index];

  const handleSwipe = useCallback(
    (priority: "low" | "high" | "urgent") => {
      if (!task) return;
      setAnim(priority === "low" ? "left" : "right");
      onSetPriority(task.id, priority);
      setTimeout(() => {
        setAnim(null);
        setIndex((i) => i + 1);
      }, 300);
    },
    [task, onSetPriority]
  );

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <span className="text-5xl mb-4">✅</span>
        <p className="text-lg">All tasks prioritized!</p>
        <p className="text-sm mt-1">Switch to Calendar view to see the sprint plan.</p>
      </div>
    );
  }

  const labels = task.labels.map((l) => l.toLowerCase());

  return (
    <div className="max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-400">
          {index + 1} / {tasks.length}
        </span>
        <div className="flex-1 mx-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${((index + 1) / tasks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={`rounded-2xl border border-gray-700 bg-gray-900 p-6 transition-all ${
          anim === "left" ? "animate-slide-left" : anim === "right" ? "animate-slide-right" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-gray-500">#{task.number}</span>
          <span className="text-xs text-gray-500">{task.repo}</span>
        </div>

        <h3 className="text-lg font-semibold mb-3 leading-snug">{task.title}</h3>

        {/* Labels */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {task.labels.map((label) => (
            <span
              key={label}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                labelColorMap[label.toLowerCase()] ?? "bg-gray-700 text-gray-300"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Current priority badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Current priority:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityBadge[task.priority]}`}
          >
            {task.priority.toUpperCase()}
          </span>
        </div>

        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-400 hover:underline"
        >
          View on GitHub →
        </a>
      </div>

      {/* Swipe buttons */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          onClick={() => handleSwipe("low")}
          className="w-16 h-16 rounded-full bg-emerald-900/40 border-2 border-emerald-600 text-emerald-400 text-2xl hover:bg-emerald-800/60 transition flex items-center justify-center"
          title="Low priority"
        >
          👎
        </button>
        <button
          onClick={() => handleSwipe("high")}
          className="w-20 h-20 rounded-full bg-amber-900/40 border-2 border-amber-600 text-amber-400 text-3xl hover:bg-amber-800/60 transition flex items-center justify-center"
          title="High priority"
        >
          ⭐
        </button>
        <button
          onClick={() => handleSwipe("urgent")}
          className="w-16 h-16 rounded-full bg-red-900/40 border-2 border-red-600 text-red-400 text-2xl hover:bg-red-800/60 transition flex items-center justify-center"
          title="Urgent"
        >
          🔥
        </button>
      </div>

      <p className="text-center text-xs text-gray-600 mt-4">
        👍 Low · ⭐ High · 🔥 Urgent
      </p>
    </div>
  );
}

const labelColorMap: Record<string, string> = {
  bug: "bg-red-900/50 text-red-300",
  feature: "bg-blue-900/50 text-blue-300",
  enhancement: "bg-purple-900/50 text-purple-300",
  documentation: "bg-gray-700 text-gray-300",
  "good first issue": "bg-emerald-900/50 text-emerald-300",
  help: "bg-amber-900/50 text-amber-300",
  frontend: "bg-cyan-900/50 text-cyan-300",
  backend: "bg-orange-900/50 text-orange-300",
};

const priorityBadge: Record<string, string> = {
  low: "bg-emerald-900/50 text-emerald-300",
  high: "bg-amber-900/50 text-amber-300",
  urgent: "bg-red-900/50 text-red-300",
};
