"use client";

import { useState, useCallback } from "react";
import { BookOpen, AlertCircle, CalendarOff, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/cn";

interface Props {
  subjects: string[];
  onSubmit: (
    data: Record<string, { attended: number; total: number }>,
    holidays: number
  ) => void;
  onBack: () => void;
}

interface SubjectInput {
  attended: string;
  total: string;
}

export default function AttendancePage({ subjects, onSubmit, onBack }: Props) {
  const [inputs, setInputs] = useState<Record<string, SubjectInput>>(() =>
    Object.fromEntries(subjects.map((s) => [s, { attended: "", total: "" }]))
  );
  const [holidays, setHolidays] = useState<string>("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (subject: string, field: "attended" | "total", value: string) => {
      setInputs((prev) => ({
        ...prev,
        [subject]: { ...prev[subject], [field]: value },
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[subject];
        return next;
      });
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const subject of subjects) {
      const { attended, total } = inputs[subject] ?? {
        attended: "",
        total: "",
      };
      const att = parseInt(attended);
      const tot = parseInt(total);
      if (isNaN(att) || isNaN(tot) || attended === "" || total === "") {
        newErrors[subject] = "Enter both values";
        continue;
      }
      if (att < 0 || tot < 0) {
        newErrors[subject] = "Values must be positive";
        continue;
      }
      if (att > tot) {
        newErrors[subject] = "Attended can't exceed total";
        continue;
      }
      if (tot === 0) {
        newErrors[subject] = "Total classes must be > 0";
        continue;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [subjects, inputs]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const data: Record<string, { attended: number; total: number }> = {};
    for (const subject of subjects) {
      const { attended, total } = inputs[subject];
      data[subject] = {
        attended: parseInt(attended),
        total: parseInt(total),
      };
    }
    const holidayCount = Math.max(0, parseInt(holidays) || 0);
    onSubmit(data, holidayCount);
  }, [subjects, inputs, holidays, validate, onSubmit]);

  const getPercentage = (subject: string): number | null => {
    const { attended, total } = inputs[subject] ?? {
      attended: "",
      total: "",
    };
    const att = parseInt(attended);
    const tot = parseInt(total);
    if (isNaN(att) || isNaN(tot) || tot === 0) return null;
    return Math.round((att / tot) * 100);
  };

  const getStatusColor = (pct: number | null) => {
    if (pct === null) return "text-muted";
    if (pct < 76) return "text-danger";
    if (pct < 81) return "text-warning";
    return "text-safe";
  };

  const getBarColor = (pct: number | null) => {
    if (pct === null) return "bg-muted";
    if (pct < 76) return "bg-danger";
    if (pct < 81) return "bg-warning";
    return "bg-safe";
  };

  const allFilled = subjects.every((s) => {
    const { attended, total } = inputs[s] ?? {};
    return attended !== "" && total !== "";
  });

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      <PageHeader
        title="Enter Attendance"
        onBack={onBack}
        step={3}
        totalSteps={4}
      />

      <div className="flex-1 px-5 py-5 max-w-lg mx-auto w-full">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border mb-4">
          <BookOpen size={15} className="text-muted mt-0.5 flex-shrink-0" />
          <p className="text-muted text-xs leading-relaxed">
            Enter{" "}
            <span className="text-white font-medium">classes attended</span> and{" "}
            <span className="text-white font-medium">total classes held</span>{" "}
            so far for each subject. Target attendance:{" "}
            <span className="text-accent font-semibold">76%</span>
          </p>
        </div>

        {/* Holidays input */}
        <div className="rounded-2xl border border-border bg-card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarOff size={15} className="text-warning" />
            <span className="text-white font-display font-semibold text-sm">
              Semester Holidays
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="50"
              placeholder="0"
              value={holidays}
              onChange={(e) => setHolidays(e.target.value)}
              className="w-24 bg-bg border border-border rounded-xl px-3 py-2.5 text-white text-sm font-mono outline-none focus:border-accent/60 transition-colors"
            />
            <div className="flex items-start gap-1.5 flex-1">
              <Info size={12} className="text-muted flex-shrink-0 mt-0.5" />
              <p className="text-muted/70 text-xs leading-relaxed">
                Number of holidays/off days in your semester (subtracted from 60
                working days)
              </p>
            </div>
          </div>
        </div>

        {/* Subject cards */}
        <div className="flex flex-col gap-3">
          {subjects.map((subject, i) => {
            const pct = getPercentage(subject);
            const statusColor = getStatusColor(pct);
            const barColor = getBarColor(pct);
            const hasError = !!errors[subject];

            return (
              <div
                key={subject}
                className={cn(
                  "rounded-2xl border bg-card p-4 transition-all duration-200 animate-fade-up",
                  hasError ? "border-danger/40" : "border-border"
                )}
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                {/* Subject name + live % */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-subtle flex items-center justify-center">
                      <span className="text-accent text-xs font-mono font-medium">
                        {subject.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-display font-semibold text-sm">
                      {subject}
                    </span>
                  </div>
                  {pct !== null && (
                    <span className={cn("text-sm font-mono font-bold", statusColor)}>
                      {pct}%
                    </span>
                  )}
                </div>

                {/* Live progress bar */}
                {pct !== null && (
                  <div className="w-full h-1 bg-subtle rounded-full mb-3 overflow-hidden relative">
                    {/* 76% marker */}
                    <div
                      className="absolute top-0 w-0.5 h-full bg-white/25 z-10"
                      style={{ left: "76%" }}
                    />
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        barColor
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-muted text-xs mb-1 block">
                      Attended
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 18"
                      value={inputs[subject]?.attended ?? ""}
                      onChange={(e) =>
                        updateField(subject, "attended", e.target.value)
                      }
                      className={cn(
                        "w-full bg-bg border rounded-xl px-3 py-2.5 text-white text-sm font-mono outline-none transition-colors",
                        hasError
                          ? "border-danger/50 focus:border-danger"
                          : "border-border focus:border-accent/60"
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-muted text-xs mb-1 block">
                      Total Held
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 24"
                      value={inputs[subject]?.total ?? ""}
                      onChange={(e) =>
                        updateField(subject, "total", e.target.value)
                      }
                      className={cn(
                        "w-full bg-bg border rounded-xl px-3 py-2.5 text-white text-sm font-mono outline-none transition-colors",
                        hasError
                          ? "border-danger/50 focus:border-danger"
                          : "border-border focus:border-accent/60"
                      )}
                    />
                  </div>
                </div>

                {/* Error */}
                {hasError && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertCircle size={12} className="text-danger flex-shrink-0" />
                    <p className="text-danger text-xs">{errors[subject]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-bg via-bg/95 to-transparent">
        <button
          onClick={handleSubmit}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 font-display font-semibold text-base rounded-2xl transition-all duration-200 active:scale-95",
            allFilled
              ? "bg-accent hover:bg-accent/90 text-white glow-accent"
              : "bg-subtle text-muted"
          )}
        >
          Calculate Results
        </button>
      </div>
    </div>
  );
}
