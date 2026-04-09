"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/* ------------------------------------------------------------------ */
/* Landing / Marketing Page                                           */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const [hovered, setHovered] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-700/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-700/20 blur-[120px]" />
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 animate-fade-in">
        <span className="inline-block mb-4 px-4 py-1.5 text-sm font-medium rounded-full bg-brand-700/20 text-brand-100 border border-brand-700/30">
          Open Source · Built for Engineering Managers
        </span>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
          Stop Assigning Tasks{" "}
          <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
            Manually
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
          Sprint Dashboard uses AI to automatically assign tasks to the right team members.
          Import your GitHub backlog, swipe to prioritize, and let the AI build your sprint plan —
          saving <strong className="text-white">5 minutes per task</strong> in manager time.
        </p>

        {/* CTA */}
        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
            hovered
              ? "bg-white text-gray-950 scale-105 shadow-lg shadow-brand-500/25"
              : "bg-brand-600 text-white hover:bg-brand-500"
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>

        {/* Social proof */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex -space-x-2">
            {[
              "bg-brand-500",
              "bg-purple-500",
              "bg-emerald-500",
              "bg-amber-500",
              "bg-rose-500",
            ].map((bg, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${bg} border-2 border-gray-950 flex items-center justify-center text-xs font-bold`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Trusted by engineering teams managing thousands of issues
          </p>
        </div>
      </div>

      {/* Value props */}
      <div className="relative z-10 mt-24 w-full max-w-5xl px-6 grid md:grid-cols-3 gap-6 pb-20">
        {[
          {
            icon: "⚡",
            title: "5 min saved per task",
            desc: "Manual assignment averages 5 minutes. AI does it instantly — multiply that across your backlog.",
          },
          {
            icon: "🧠",
            title: "Skill-matched assignments",
            desc: "AI matches tasks to team members based on labels, past contributions, and availability.",
          },
          {
            icon: "📊",
            title: "Real cost savings",
            desc: "Track hours saved and translate to dollar amounts based on engineering manager salary.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur"
          >
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-semibold mt-3 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
