"use client";

import { motion } from "framer-motion";
import { MoreHorizontal, Plus, Clock, MessageSquare, GripVertical, CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_COLUMNS = [
  { id: "todo", title: "To Do", count: 4, 
    tasks: [
      { id: "UBI-142", title: "Refactor Telegram A2A Bridge", points: 8, assign: "VD", tags: ["Backend"] },
      { id: "UBI-145", title: "Design Sprint Analytics Graph", points: 5, assign: "ZG", tags: ["UI/UX"] }
    ] 
  },
  { id: "progress", title: "In Progress", count: 2, 
    tasks: [
      { id: "UBI-139", title: "Implement Stripe OAuth Checkout", points: 13, assign: "DB", tags: ["Core", "Auth"] }
    ] 
  },
  { id: "review", title: "Review (CodeRabbit)", count: 1, 
    tasks: [
      { id: "UBI-120", title: "Fix iOS Safari viewport height bug", points: 3, assign: "ZG", tags: ["Hotfix"] }
    ] 
  },
  { id: "done", title: "Done", count: 24, 
    tasks: [
      { id: "UBI-111", title: "Database Migration to Supabase", points: 21, assign: "DB", tags: ["Infra"] }
    ] 
  }
];

export default function SprintBoard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enterprise Kanban</h2>
          <p className="text-white/50 mt-1">Drag and drop issues to orchestrate the swarm.</p>
        </div>
        <Button className="bg-ubiquity-600 hover:bg-ubiquity-500 shadow-lg shadow-ubiquity-500/20 text-white gap-2">
          <Plus className="w-4 h-4" /> New Issue
        </Button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-220px)] items-start">
        {MOCK_COLUMNS.map((column, colIdx) => (
          <motion.div 
            key={column.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIdx * 0.1 }}
            className="flex-shrink-0 w-80 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col max-h-full"
          >
            {/* Column Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white/90">{column.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium text-white/60">
                  {column.count}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Task Area */}
            <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              {column.tasks.map((task, tIdx) => (
                <motion.div 
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#121214] border border-white/10 p-4 rounded-lg shadow-xl relative group cursor-grab active:cursor-grabbing hover:border-ubiquity-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3 text-white/40 group-hover:text-white/60 transition-colors">
                    <span className="text-xs font-mono">{task.id}</span>
                    <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-medium text-white leading-snug mb-4">{task.title}</h4>
                  
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {task.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-ubiquity-500/10 text-ubiquity-400 text-[10px] uppercase tracking-wider font-bold rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-medium">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                        <CircleDashed className="w-3.5 h-3.5 text-ubiquity-400" />
                        {task.points} pts
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      {task.assign}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
