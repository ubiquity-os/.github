"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowRight,
  Clock,
  Zap,
  SkipForward,
} from "lucide-react";
import { SprintTask, Priority } from "@/types";

interface PrioritySwiperProps {
  tasks: SprintTask[];
  onPrioritySet: (taskId: string, priority: Priority) => void;
}

export function PrioritySwiper({ tasks, onPrioritySet }: PrioritySwiperProps) {
  const unprioritized = tasks.filter(
    (t) => t.status === "backlog" && !t.priority
  );
  const allTasks = unprioritized.length > 0 ? unprioritized : tasks;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [swiped, setSwiped] = useState<Set<string>>(new Set());

  const currentTask = allTasks.length > 0 ? allTasks[currentIdx % allTasks.length] : null;

  const handleSwipe = useCallback(
    (priority: Priority) => {
      if (!currentTask) return;
      onPrioritySet(currentTask.id, priority);
      setSwiped((prev) => new Set(prev).add(currentTask.id));
      setCurrentIdx((prev) => prev + 1);
    },
    [currentTask, onPrioritySet]
  );

  if (!currentTask) return null;

  const remaining = allTasks.length - swiped.size;

  return (
    <Card className="border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <CardTitle className="text-lg">Quick Prioritize</CardTitle>
        </div>
        <span className="text-xs text-zinc-500">
          {remaining} tasks remaining
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Current task card */}
          <div className="p-6 rounded-xl border border-zinc-700 bg-zinc-800/50 mb-4 min-h-[180px]">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-medium text-white pr-4">
                {currentTask.title}
              </h3>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {currentTask.repo}#{currentTask.issue_number}
              </Badge>
            </div>

            {currentTask.description && (
              <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
                {currentTask.description}
              </p>
            )}

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                AI estimate: {currentTask.estimated_hours}h
              </span>
              {currentTask.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="secondary" className="text-[10px]">
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
              onClick={() => handleSwipe("low")}
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
              <span className="text-[10px] text-zinc-400">Low</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-blue-700/50 hover:bg-blue-900/20 hover:border-blue-600/50"
              onClick={() => handleSwipe("medium")}
            >
              <ArrowRight className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] text-blue-400">Medium</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-orange-700/50 hover:bg-orange-900/20 hover:border-orange-600/50"
              onClick={() => handleSwipe("high")}
            >
              <ChevronRight className="w-5 h-5 text-orange-400" />
              <span className="text-[10px] text-orange-400">High</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-red-700/50 hover:bg-red-900/20 hover:border-red-600/50"
              onClick={() => handleSwipe("urgent")}
            >
              <ChevronUp className="w-5 h-5 text-red-400" />
              <span className="text-[10px] text-red-400">Urgent</span>
            </Button>
          </div>

          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
            >
              <SkipForward className="w-3 h-3 mr-1" />
              Skip
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
