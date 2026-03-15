"use client";

import { Github, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
              <Hexagon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">
              UbiquityOS
            </span>
            <span className="text-sm text-zinc-500 hidden sm:inline">
              Sprint Manager
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#roi"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ROI Calculator
            </a>
            <a
              href="https://github.com/ubiquity-os"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <Button
            size="sm"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Github className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
}
