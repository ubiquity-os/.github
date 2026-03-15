"use client";

import { ArrowRight, Github, Zap, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(109,40,217,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Sprint Management</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            <span className="text-white">AI Sprint Manager</span>
            <br />
            <span className="gradient-text">for Engineering Teams</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Connect your GitHub organization and let AI analyze your backlog,
            estimate task durations, assign work to the right people, and show
            you exactly how much time and money you save.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button
              size="xl"
              className="group w-full sm:w-auto"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <Github className="w-5 h-5 mr-2" />
              Sign in with GitHub
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto"
              onClick={() => (window.location.href = "/dashboard?demo=true")}
            >
              View Live Demo
            </Button>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-2xl font-bold text-white">12.8h</span>
              </div>
              <span className="text-xs text-zinc-500">Saved per sprint</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-white">$26k</span>
              </div>
              <span className="text-xs text-zinc-500">Annual savings</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-white">34%</span>
              </div>
              <span className="text-xs text-zinc-500">More efficient</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
