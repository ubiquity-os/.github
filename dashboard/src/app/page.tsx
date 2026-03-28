"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Code, Users, LineChart, Zap, CheckCircle2, Blocks, Cpu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const [teamSize, setTeamSize] = useState(5);
  const [hoursPerSprint, setHoursPerSprint] = useState(40);
  
  const estimatedSavings = Math.round((teamSize * hoursPerSprint * 0.15) * 100);

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-ubiquity-500/30 font-sans overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-ubiquity-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-ubiquity-800/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5 glass sticky top-0 md:relative md:glass-none md:border-none md:bg-transparent">
          <div className="flex items-center gap-2">
            <Blocks className="w-8 h-8 text-ubiquity-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              UbiquityOS Sprint
            </span>
          </div>
          <Link href="/api/auth/github">
            <Button variant="glass" className="gap-2 rounded-full px-6">
              <Github className="w-4 h-4" />
              Sign in with GitHub
            </Button>
          </Link>
        </nav>

        {/* Hero Section */}
        <main className="px-8 max-w-7xl mx-auto pt-24 pb-32">
          <motion.div 
            initial="hidden" animate="show" variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ubiquity-500/10 border border-ubiquity-500/20 text-ubiquity-300 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Sprint Management evolved for 2026</span>
            </motion.div>
            
            <motion.div variants={fadeUp}>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8">
                Orchestrate code.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ubiquity-400 to-ubiquity-700">
                  Deploy at velocity.
                </span>
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xl text-white/50 mb-12 max-w-2xl leading-relaxed text-balance">
              The AI-native dashboard that converts raw GitHub issues into perfectly load-balanced sprints. Predict costs, balance developers, and track ROI in real-time.
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-4">
              <Link href="/api/auth/github">
                <Button size="lg" className="rounded-full gap-2 text-lg h-14 px-8 bg-white text-black hover:bg-white/90">
                  Deploy Workspace <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </main>

        {/* ROI Calculator Section */}
        <section className="px-8 py-24 bg-black/40 border-y border-white/5 relative z-10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-bold mb-6">Quantify your efficiency.</h2>
              <p className="text-white/50 text-lg mb-8">Manual sprint planning drains 15% of your engineering budget. See exactly how much capital you reclaim by letting UbiquityOS orchestrate the assignments.</p>
              
              <div className="space-y-8 glass p-8 rounded-2xl">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-medium text-white/80">Team Size (Engineers)</label>
                    <span className="text-ubiquity-400 font-mono">{teamSize}</span>
                  </div>
                  <input type="range" min="1" max="50" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} className="w-full accent-ubiquity-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-medium text-white/80">Sprint Hours / Week</label>
                    <span className="text-ubiquity-400 font-mono">{hoursPerSprint}h</span>
                  </div>
                  <input type="range" min="20" max="80" value={hoursPerSprint} onChange={(e) => setHoursPerSprint(parseInt(e.target.value))} className="w-full accent-ubiquity-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex justify-center">
              <div className="glass-dark p-12 rounded-3xl w-full max-w-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ubiquity-500/20 blur-[50px] rounded-full" />
                <h3 className="text-sm uppercase tracking-widest text-white/40 mb-2 font-semibold">Estimated Monthly Savings</h3>
                <div className="text-7xl font-black text-white mb-6 font-mono tracking-tighter">
                  ${estimatedSavings.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Based on $100/hr average developer rate
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-8 py-32 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Operating Capabilities</h2>
            <p className="text-white/50 text-lg">Hyper-optimized for elite developer environments.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Cpu />, title: "AI Workload Balancing", desc: "Predictively assigns GitHub issues based on developer commit history and token output." },
              { icon: <LineChart />, title: "Real-time ROI Tracking", desc: "Live dashboard tracking budget burn against resolved issues." },
              { icon: <Users />, title: "Kanban Supremacy", desc: "Tinder-inspired swipe UI for ultra-fast task prioritization by product managers." },
              { icon: <Code />, title: "CodeRabbit Sync", desc: "Native integration with CodeRabbit CI/CD feedback loops." },
              { icon: <Shield />, title: "Strict Payload Config", desc: "100% TypeSafe validation of GitHub REST payloads." },
              { icon: <CheckCircle2 />, title: "Zero Data Lock-in", desc: "Everything remains in native GitHub labels, milestones, and issues." },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-ubiquity-500/20 flex items-center justify-center text-ubiquity-400 mb-6 border border-ubiquity-500/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
