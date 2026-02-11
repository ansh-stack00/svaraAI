"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Brain, TrendingUp, ArrowRight } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 selection:bg-violet-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-black/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight">
                SvaraAgent
              </span>
            </div>

            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30">
                  Get Started
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm backdrop-blur-md">
              <Zap className="w-4 h-4 text-violet-400" />
              Powered by Advanced AI
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Build Voice Agents
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                In Minutes
              </span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl">
              Create AI-powered voice agents that handle calls, answer
              questions, and automate conversations with your custom
              knowledge base.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-600/30 group"
                >
                  Start Building Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-violet-400">
                  10K+
                </div>
                <p className="text-gray-500">Active Agents</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">
                  99.9%
                </div>
                <p className="text-gray-500">Uptime</p>
              </div>
            </div>

          </div>

          {/* Visual */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl bg-gradient-to-br from-violet-600/10 to-cyan-400/10 border border-white/10 backdrop-blur-xl p-16 shadow-2xl shadow-violet-900/20">
              <Mic className="w-24 h-24 text-violet-500/40 mx-auto mb-6" />
              <p className="text-center text-gray-500">
                Interactive Voice Interface
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-gray-400">
            Everything you need to build and scale voice agents
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {[ 
            {
              icon: Mic,
              title: "Real-Time Conversations",
              desc: "Ultra-low latency WebRTC voice interactions powered by cutting-edge AI.",
            },
            {
              icon: Brain,
              title: "Custom Knowledge Base",
              desc: "Upload documents and train agents on your private data.",
            },
            {
              icon: TrendingUp,
              title: "Advanced Analytics",
              desc: "Real-time insights, call tracking, and performance metrics.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-400/20 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.desc}
              </p>
            </div>
          ))}

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32 py-12 text-center text-gray-500">
        © 2026 VoiceAgent. Built with modern AI.
      </footer>

    </div>
  );
}
