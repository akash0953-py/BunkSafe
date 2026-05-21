"use client";

import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";

interface Props {
  onStart: () => void;
}

export default function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="font-display font-700 text-white text-lg tracking-tight">
            BunkSafe
          </span>
        </div>
        <span className="text-muted text-xs font-mono">v1.0</span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-8 animate-fade-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-accent text-xs font-mono font-medium">
            AI-Powered Attendance Planner
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-display font-extrabold text-5xl sm:text-6xl text-white leading-[1.05] tracking-tight mb-4 animate-fade-up"
          style={{ animationDelay: "0.15s", opacity: 0 }}
        >
          Know exactly{" "}
          <span className="text-accent relative">
            how many
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent/40 rounded-full" />
          </span>
          <br />
          classes you can{" "}
          <span className="relative">
            skip
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-danger/60 rounded-full" />
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p
          className="text-muted text-base sm:text-lg max-w-sm leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: "0.25s", opacity: 0 }}
        >
          Upload your timetable. Enter your attendance. Get instant answers.
          <br />
          No more guessing.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="group relative flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base rounded-2xl transition-all duration-200 glow-accent hover:scale-105 active:scale-95 animate-fade-up"
          style={{ animationDelay: "0.35s", opacity: 0 }}
        >
          <Zap size={18} className="group-hover:animate-pulse" />
          Upload Timetable
          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition-transform duration-200"
          />
        </button>

        {/* Trust badges */}
        <p
          className="text-muted/60 text-xs mt-5 animate-fade-in"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          No login · No data stored · Works offline
        </p>

        {/* Feature cards */}
        <div
          className="grid grid-cols-3 gap-3 mt-14 w-full max-w-sm animate-fade-up"
          style={{ animationDelay: "0.45s", opacity: 0 }}
        >
          {[
            {
              icon: Shield,
              label: "Safe Bunks",
              desc: "Exactly how many you can skip",
              color: "text-safe",
            },
            {
              icon: TrendingUp,
              label: "Prediction",
              desc: "Future attendance forecast",
              color: "text-accent",
            },
            {
              icon: Zap,
              label: "Recovery",
              desc: "Classes to attend to recover",
              color: "text-warning",
            },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border text-center"
            >
              <Icon size={18} className={color} />
              <div>
                <p className="text-white text-xs font-semibold font-display">
                  {label}
                </p>
                <p className="text-muted text-[10px] leading-tight mt-0.5">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 pt-2 text-center">
        <p className="text-muted/40 text-xs">
          Built for students, by students 🎓
        </p>
      </div>
    </div>
  );
}
