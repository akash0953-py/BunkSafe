"use client";

import { useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Zap,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { SubjectResult } from "@/types";
import { getOverallStatus, getAverageAttendance } from "@/utils/calculations";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/cn";

interface Props {
  results: SubjectResult[];
  onReset: () => void;
  onBack: () => void;
}

const STATUS_CONFIG = {
  safe: {
    label: "You're Safe",
    desc: "Attendance is healthy",
    icon: Shield,
    color: "text-safe",
    bg: "bg-safe/10",
    border: "border-safe/25",
    glow: "glow-safe",
    bar: "bg-safe",
  },
  warning: {
    label: "Borderline",
    desc: "Tread carefully",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/25",
    glow: "glow-warning",
    bar: "bg-warning",
  },
  danger: {
    label: "Danger Zone",
    desc: "Attend immediately",
    icon: XCircle,
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/25",
    glow: "glow-danger",
    bar: "bg-danger",
  },
};

function StatPill({
  label,
  value,
  icon,
  positive,
  alert,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-black/20 rounded-xl p-2">
      <div
        className={cn(
          "flex items-center gap-1",
          alert ? "text-danger" : positive ? "text-safe" : "text-muted"
        )}
      >
        {icon}
        <span
          className={cn(
            "text-sm font-mono font-bold",
            alert ? "text-danger" : "text-white"
          )}
        >
          {value}
        </span>
      </div>
      <span className="text-muted/70 text-[10px] text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function SubjectCard({
  result,
  index,
}: {
  result: SubjectResult;
  index: number;
}) {
  const cfg = STATUS_CONFIG[result.status];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-200 animate-fade-up",
        cfg.bg,
        cfg.border
      )}
      style={{ animationDelay: `${index * 0.07}s`, opacity: 0 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border",
              cfg.bg,
              cfg.border
            )}
          >
            <Icon size={15} className={cfg.color} />
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm leading-tight">
              {result.subjectName}
            </p>
            <p className={cn("text-xs font-medium mt-0.5", cfg.color)}>
              {cfg.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-mono font-bold leading-none", cfg.color)}>
            {result.percentage}%
          </p>
          <p className="text-muted text-xs mt-0.5">current</p>
        </div>
      </div>

      {/* Progress bar — 76% marker */}
      <div className="w-full h-1.5 bg-black/30 rounded-full mb-3 overflow-hidden relative">
        <div
          className="absolute top-0 w-0.5 h-full bg-white/25 z-10"
          style={{ left: "76%" }}
        />
        <div
          className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
          style={{ width: `${Math.min(result.percentage, 100)}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {result.status !== "danger" ? (
          <StatPill
            label="Safe Bunks"
            value={`${result.safeBunks}`}
            icon={<Zap size={11} />}
            positive={result.safeBunks > 0}
          />
        ) : (
          <StatPill
            label="Attend Next"
            value={`${result.classesToAttend}`}
            icon={<BookOpen size={11} />}
            alert
          />
        )}

        <StatPill
          label="Predicted"
          value={`${result.predictedFinal}%`}
          icon={<TrendingUp size={11} />}
          positive={result.predictedFinal >= 76}
        />

        <StatPill
          label="Sem Total"
          value={`${result.semesterTotal}`}
          icon={<BarChart3 size={11} />}
        />
      </div>

      {/* Semester stats bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 mb-2">
        <div className="flex-1 grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-white text-xs font-mono font-bold">
              {result.attended}/{result.totalHeld}
            </p>
            <p className="text-muted/60 text-[10px]">Attended/Held</p>
          </div>
          <div>
            <p className="text-accent text-xs font-mono font-bold">
              {result.minRequired}
            </p>
            <p className="text-muted/60 text-[10px]">Min Required</p>
          </div>
          <div>
            <p className="text-muted text-xs font-mono font-bold">
              {result.remainingClasses}
            </p>
            <p className="text-muted/60 text-[10px]">Remaining</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {result.status === "danger" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/20">
          <XCircle size={12} className="text-danger flex-shrink-0" />
          <p className="text-danger text-xs">
            Attend{" "}
            <span className="font-bold">{result.classesToAttend} classes</span>{" "}
            continuously to recover to 76%
          </p>
        </div>
      )}

      {result.status !== "danger" && result.safeBunks > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-safe/10 border border-safe/20">
          <CheckCircle2 size={12} className="text-safe flex-shrink-0" />
          <p className="text-safe text-xs">
            You can skip{" "}
            <span className="font-bold">
              {result.safeBunks} more{" "}
              {result.safeBunks === 1 ? "class" : "classes"}
            </span>{" "}
            this semester safely
          </p>
        </div>
      )}

      {result.status === "warning" && result.safeBunks === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle size={12} className="text-warning flex-shrink-0" />
          <p className="text-warning text-xs">
            Do <span className="font-bold">NOT</span> skip any more classes
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ results, onReset, onBack }: Props) {
  const overallStatus = useMemo(() => getOverallStatus(results), [results]);
  const avgAttendance = useMemo(() => getAverageAttendance(results), [results]);
  const dangerCount = results.filter((r) => r.status === "danger").length;
  const safeCount = results.filter((r) => r.status === "safe").length;
  const totalSemClasses = results.reduce((s, r) => s + r.semesterTotal, 0);
  const totalMinRequired = results.reduce((s, r) => s + r.minRequired, 0);

  const cfg = STATUS_CONFIG[overallStatus];
  const OverallIcon = cfg.icon;

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      <PageHeader title="Your Results" onBack={onBack} step={4} totalSteps={4} />

      <div className="flex-1 px-5 py-5 max-w-lg mx-auto w-full">
        {/* Overall status card */}
        <div
          className={cn(
            "rounded-2xl border p-5 mb-5 animate-fade-up",
            cfg.bg,
            cfg.border,
            cfg.glow
          )}
          style={{ opacity: 0 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted text-xs mb-1">Overall Status</p>
              <div className="flex items-center gap-2">
                <OverallIcon size={20} className={cfg.color} />
                <p
                  className={cn(
                    "font-display font-extrabold text-2xl",
                    cfg.color
                  )}
                >
                  {cfg.label}
                </p>
              </div>
              <p className="text-muted text-xs mt-1">{cfg.desc}</p>
            </div>
            <div className="text-right">
              <p
                className={cn("text-4xl font-mono font-bold", cfg.color)}
              >
                {avgAttendance}%
              </p>
              <p className="text-muted text-xs">avg attendance</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "Subjects",
                value: results.length,
                color: "text-white",
              },
              { label: "Safe", value: safeCount, color: "text-safe" },
              { label: "Danger", value: dangerCount, color: "text-danger" },
              {
                label: "Min Classes",
                value: totalMinRequired,
                color: "text-accent",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-black/20 rounded-xl p-2.5 text-center">
                <p className={cn("text-lg font-mono font-bold", color)}>
                  {value}
                </p>
                <p className="text-muted/70 text-[10px] mt-0.5 leading-tight">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Semester summary */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20">
            <BarChart3 size={12} className="text-muted flex-shrink-0" />
            <p className="text-muted text-xs">
              Estimated semester total:{" "}
              <span className="text-white font-medium">
                {totalSemClasses} classes
              </span>{" "}
              across all subjects
            </p>
          </div>
        </div>

        {/* Subject breakdown */}
        <p className="text-muted text-xs font-medium mb-3 uppercase tracking-widest">
          Subject Breakdown
        </p>

        <div className="flex flex-col gap-3">
          {[...results]
            .sort((a, b) => {
              const order = { danger: 0, warning: 1, safe: 2 };
              return order[a.status] - order[b.status];
            })
            .map((result, i) => (
              <SubjectCard key={result.subjectName} result={result} index={i} />
            ))}
        </div>

        <div className="h-24" />
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-bg via-bg/95 to-transparent flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-border bg-card hover:border-accent/40 text-white font-display font-semibold text-sm rounded-2xl transition-all duration-200 active:scale-95"
        >
          Edit Attendance
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-5 py-3.5 border border-border bg-card hover:border-danger/40 hover:text-danger text-muted font-display font-semibold text-sm rounded-2xl transition-all duration-200 active:scale-95"
        >
          <RefreshCw size={15} />
          Reset
        </button>
      </div>
    </div>
  );
}
