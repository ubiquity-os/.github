"use client";

import { LayoutDashboard, Calendar, BarChart3, LogOut, Blocks } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex text-sm">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Blocks className="w-5 h-5 text-ubiquity-400 mr-2" />
          <span className="font-bold text-white tracking-wide">UbiquityOS</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-3 py-2.5 rounded-lg bg-ubiquity-500/10 text-ubiquity-300 font-medium">
            <LayoutDashboard className="w-4 h-4 mr-3" /> Sprint Board
          </Link>
          <Link href="/dashboard/calendar" className="flex items-center px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            <Calendar className="w-4 h-4 mr-3" /> Calendar
          </Link>
          <Link href="/dashboard/metrics" className="flex items-center px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4 mr-3" /> ROI Metrics
          </Link>
        </nav>
        <div className="p-4 border-t border-white/5">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white/50 hover:text-red-400"
            onClick={() => {
              document.cookie = "ubiquity_session=; Max-Age=0; path=/";
              window.location.href = "/";
            }}
          >
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen pb-12">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Active Sprint: Alpha-7</h1>
            <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-ubiquity-600 to-ubiquity-400 border border-white/20 shadow-lg" />
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
