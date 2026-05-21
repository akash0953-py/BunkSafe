"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  Clock,
} from "lucide-react";
import { TimetableDay, TimetableEntry } from "@/types";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/cn";

interface Props {
  timetable: TimetableDay[];
  imagePreview: string | null;
  slotDurationMinutes: number;
  onConfirm: (timetable: TimetableDay[]) => void;
  onBack: () => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimetablePage({
  timetable: initial,
  slotDurationMinutes,
  onConfirm,
  onBack,
}: Props) {
  const [timetable, setTimetable] = useState<TimetableDay[]>(() => {
    const existing = new Map(initial.map((d) => [d.day, d.subjects]));
    return DAYS.map((day) => ({ day, subjects: existing.get(day) ?? [] }));
  });

  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(initial.filter((d) => d.subjects.length > 0).map((d) => d.day))
  );

  const [editingCell, setEditingCell] = useState<{
    day: string;
    idx: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newSubject, setNewSubject] = useState<Record<string, string>>({});

  const toggleDay = useCallback((day: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }, []);

  const updateSubjectName = useCallback(
    (day: string, idx: number, name: string) => {
      setTimetable((prev) =>
        prev.map((d) =>
          d.day === day
            ? {
                ...d,
                subjects: d.subjects.map((s, i) =>
                  i === idx ? { ...s, name } : s
                ),
              }
            : d
        )
      );
    },
    []
  );

  const deleteSubject = useCallback((day: string, idx: number) => {
    setTimetable((prev) =>
      prev.map((d) =>
        d.day === day
          ? { ...d, subjects: d.subjects.filter((_, i) => i !== idx) }
          : d
      )
    );
  }, []);

  const addSubject = useCallback(
    (day: string) => {
      const val = (newSubject[day] ?? "").trim();
      if (!val) return;
      const entry: TimetableEntry = { name: val, classesPerSlot: 1 };
      setTimetable((prev) =>
        prev.map((d) =>
          d.day === day ? { ...d, subjects: [...d.subjects, entry] } : d
        )
      );
      setNewSubject((prev) => ({ ...prev, [day]: "" }));
    },
    [newSubject]
  );

  const totalSubjects = timetable.reduce(
    (sum, d) => sum + d.subjects.length,
    0
  );

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      <PageHeader
        title="Review Schedule"
        onBack={onBack}
        step={2}
        totalSteps={4}
      />

      <div className="flex-1 px-5 py-5 max-w-lg mx-auto w-full">
        {/* AI result banner */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 mb-4">
          <Edit3 size={15} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-accent/90 text-xs leading-relaxed">
              AI extracted your schedule. Edit, add or delete subjects if
              anything is wrong before continuing.
            </p>
          </div>
        </div>

        {/* Slot duration pill */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border">
            <Clock size={12} className="text-accent" />
            <span className="text-xs text-muted font-mono">
              Slot duration:{" "}
              <span className="text-white font-medium">
                {slotDurationMinutes} min
              </span>
            </span>
          </div>
          <span className="text-muted/60 text-xs">
            {totalSubjects} lectures ·{" "}
            {timetable.filter((d) => d.subjects.length > 0).length} days
          </span>
        </div>

        {/* Day cards */}
        <div className="flex flex-col gap-3">
          {timetable.map((dayData) => {
            const isExpanded = expandedDays.has(dayData.day);
            const hasSubjects = dayData.subjects.length > 0;

            return (
              <div
                key={dayData.day}
                className={cn(
                  "rounded-2xl border transition-all duration-200",
                  hasSubjects
                    ? "border-border bg-card"
                    : "border-border/50 bg-card/40"
                )}
              >
                {/* Day header */}
                <button
                  onClick={() => toggleDay(dayData.day)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        hasSubjects ? "bg-accent" : "bg-muted/40"
                      )}
                    />
                    <span
                      className={cn(
                        "font-display font-semibold text-sm",
                        hasSubjects ? "text-white" : "text-muted"
                      )}
                    >
                      {dayData.day}
                    </span>
                    {hasSubjects && (
                      <span className="text-xs text-muted font-mono bg-subtle px-1.5 py-0.5 rounded-md">
                        {dayData.subjects.length}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={15} className="text-muted" />
                  ) : (
                    <ChevronDown size={15} className="text-muted" />
                  )}
                </button>

                {/* Subjects list */}
                {isExpanded && (
                  <div className="px-4 pb-4 flex flex-col gap-2">
                    {dayData.subjects.length === 0 && (
                      <p className="text-muted/50 text-xs text-center py-2">
                        No subjects — add one below
                      </p>
                    )}

                    {dayData.subjects.map((entry, idx) => {
                      const isEditing =
                        editingCell?.day === dayData.day &&
                        editingCell?.idx === idx;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-subtle rounded-xl px-3 py-2.5"
                        >
                          {isEditing ? (
                            <>
                              <input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateSubjectName(
                                      dayData.day,
                                      idx,
                                      editValue.trim() || entry.name
                                    );
                                    setEditingCell(null);
                                  }
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                className="flex-1 bg-transparent text-white text-sm outline-none font-medium"
                              />
                              <button
                                onClick={() => {
                                  updateSubjectName(
                                    dayData.day,
                                    idx,
                                    editValue.trim() || entry.name
                                  );
                                  setEditingCell(null);
                                }}
                                className="text-safe hover:opacity-80 transition-opacity"
                              >
                                <Check size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-white text-sm font-medium">
                                {entry.name}
                              </span>
                              {/* Show classes badge for multi-slot entries */}
                              {entry.classesPerSlot > 1 && (
                                <span className="text-[10px] font-mono text-accent bg-accent/15 px-1.5 py-0.5 rounded-md">
                                  ×{entry.classesPerSlot}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingCell({ day: dayData.day, idx });
                                  setEditValue(entry.name);
                                }}
                                className="text-muted hover:text-accent transition-colors p-1"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSubject(dayData.day, idx)
                                }
                                className="text-muted hover:text-danger transition-colors p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Add subject input */}
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Add subject..."
                        value={newSubject[dayData.day] ?? ""}
                        onChange={(e) =>
                          setNewSubject((prev) => ({
                            ...prev,
                            [dayData.day]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addSubject(dayData.day);
                        }}
                        className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted/40 outline-none focus:border-accent/60 transition-colors"
                      />
                      <button
                        onClick={() => addSubject(dayData.day)}
                        className="w-9 h-9 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/30 flex items-center justify-center text-accent transition-colors flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
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
        {totalSubjects === 0 && (
          <p className="text-center text-muted text-xs mb-3">
            Add at least one subject to continue
          </p>
        )}
        <button
          onClick={() => {
            const filtered = timetable.map((d) => ({
              ...d,
              subjects: d.subjects.filter((s) => s.name.trim().length > 0),
            }));
            onConfirm(filtered);
          }}
          disabled={totalSubjects === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 font-display font-semibold text-base rounded-2xl transition-all duration-200 active:scale-95",
            totalSubjects > 0
              ? "bg-accent hover:bg-accent/90 text-white glow-accent"
              : "bg-subtle text-muted cursor-not-allowed"
          )}
        >
          Looks Good — Enter Attendance
        </button>
      </div>
    </div>
  );
}
