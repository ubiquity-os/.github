"use client";

import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  Users,
  BarChart3,
  Hexagon,
  LogOut,
  Zap,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "overview" | "calendar" | "board" | "team" | "metrics" | "prioritize";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "board", label: "Task Board", icon: KanbanSquare },
  { id: "team", label: "Team", icon: Users },
  { id: "prioritize", label: "Prioritize", icon: Zap },
  { id: "metrics", label: "ROI Metrics", icon: BarChart3 },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
          <Hexagon className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">UbiquityOS</span>
          <p className="text-[10px] text-zinc-500">Sprint Manager</p>
        </div>
      </div>

      {/* Org info */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/50">
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-zinc-300 truncate">ubiquity-os</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              activeView === item.id
                ? "bg-violet-600/10 text-violet-300 border border-violet-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          onClick={() => (window.location.href = "/")}
        >
          <LogOut className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </aside>
  );
}
