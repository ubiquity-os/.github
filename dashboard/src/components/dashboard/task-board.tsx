"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SprintTask, Priority, TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";

interface TaskBoardProps {
  tasks: SprintTask[];
  onUpdateTask?: (taskId: string, updates: Partial<SprintTask>) => void;
}

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "text-zinc-400" },
  { key: "todo", label: "To Do", color: "text-blue-400" },
  { key: "in_progress", label: "In Progress", color: "text-amber-400" },
  { key: "review", label: "Review", color: "text-purple-400" },
  { key: "done", label: "Done", color: "text-emerald-400" },
];

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];

function TaskCard({
  task,
  onPriorityChange,
}: {
  task: SprintTask;
  onPriorityChange?: (direction: "up" | "down") => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-700 transition-all duration-200">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPriorityChange?.("up")}
            className="p-0.5 hover:bg-zinc-800 rounded"
            title="Increase priority"
          >
            <ChevronUp className="w-3 h-3 text-zinc-500" />
          </button>
          <GripVertical className="w-3 h-3 text-zinc-600 drag-handle" />
          <button
            onClick={() => onPriorityChange?.("down")}
            className="p-0.5 hover:bg-zinc-800 rounded"
            title="Decrease priority"
          >
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-white text-left hover:text-violet-300 transition-colors line-clamp-2"
            >
              {task.title}
            </button>
            <a
              href={task.issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>

          {expanded && task.description && (
            <p className="text-xs text-zinc-500 mb-2 line-clamp-3">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={task.priority as "urgent" | "high" | "medium" | "low"}>
              {task.priority}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              {task.estimated_hours}h
            </span>
            <span className="text-xs text-zinc-600">
              {task.repo}#{task.issue_number}
            </span>
          </div>

          {task.assignee && (
            <div className="flex items-center gap-2 mt-2">
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.login}
                className="w-5 h-5 rounded-full border border-zinc-700"
              />
              <span className="text-xs text-zinc-400">
                {task.assignee.login}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskBoard({ tasks, onUpdateTask }: TaskBoardProps) {
  const [sortBy, setSortBy] = useState<"priority" | "hours" | "value">(
    "priority"
  );

  const sortTasks = (taskList: SprintTask[]) => {
    return [...taskList].sort((a, b) => {
      if (sortBy === "priority") {
        return (
          PRIORITY_ORDER.indexOf(a.priority) -
          PRIORITY_ORDER.indexOf(b.priority)
        );
      }
      if (sortBy === "hours") {
        return b.estimated_hours - a.estimated_hours;
      }
      return b.business_value - a.business_value;
    });
  };

  const handlePriorityChange = (
    taskId: string,
    currentPriority: Priority,
    direction: "up" | "down"
  ) => {
    const idx = PRIORITY_ORDER.indexOf(currentPriority);
    const newIdx =
      direction === "up"
        ? Math.max(0, idx - 1)
        : Math.min(PRIORITY_ORDER.length - 1, idx + 1);
    if (newIdx !== idx && onUpdateTask) {
      onUpdateTask(taskId, { priority: PRIORITY_ORDER[newIdx] });
    }
  };

  return (
    <Card className="border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Task Board</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Sort:</span>
          {(["priority", "hours", "value"] as const).map((s) => (
            <Button
              key={s}
              variant={sortBy === s ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSortBy(s)}
            >
              {s === "priority"
                ? "Priority"
                : s === "hours"
                  ? "Estimate"
                  : "Value"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = sortTasks(
              tasks.filter((t) => t.status === column.key)
            );
            return (
              <div key={column.key}>
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-sm font-medium ${column.color}`}
                  >
                    {column.label}
                  </h3>
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onPriorityChange={(dir) =>
                        handlePriorityChange(task.id, task.priority, dir)
                      }
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-600">
                      No tasks
                    </div>
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
