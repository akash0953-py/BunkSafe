"use client";

import { useState, useCallback } from "react";
import { AppState, TimetableDay } from "@/types";
import LandingPage from "@/components/LandingPage";
import UploadPage from "@/components/UploadPage";
import TimetablePage from "@/components/TimetablePage";
import AttendancePage from "@/components/AttendancePage";
import DashboardPage from "@/components/DashboardPage";
import { extractUniqueSubjects, buildWeeklyCountMap } from "@/utils/gemini";
import { calculateResults } from "@/utils/calculations";

const initialState: AppState = {
  step: "landing",
  imageFile: null,
  imagePreview: null,
  slotDurationMinutes: 60,
  timetable: [],
  uniqueSubjects: [],
  holidays: 0,
  attendanceData: {},
  results: [],
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Called by UploadPage after Gemini extraction succeeds
  const handleExtractComplete = useCallback(
    (timetable: TimetableDay[], slotDurationMinutes: number, file: File, preview: string) => {
      const uniqueSubjects = extractUniqueSubjects(timetable);
      updateState({
        imageFile: file,
        imagePreview: preview,
        slotDurationMinutes,
        timetable,
        uniqueSubjects,
        step: "timetable",
      });
    },
    [updateState]
  );

  // Called by TimetablePage after user confirms / edits schedule
  const handleTimetableConfirm = useCallback(
    (timetable: TimetableDay[]) => {
      const uniqueSubjects = extractUniqueSubjects(timetable);
      updateState({ timetable, uniqueSubjects, step: "attendance" });
    },
    [updateState]
  );

  // Called by AttendancePage with per-subject data + holiday count
  const handleAttendanceSubmit = useCallback(
    (
      attendanceData: Record<string, { attended: number; total: number }>,
      holidays: number
    ) => {
      const weeklyCountMap = buildWeeklyCountMap(state.timetable);
      const results = calculateResults(
        state.uniqueSubjects,
        attendanceData,
        weeklyCountMap,
        holidays,
        state.timetable
      );
      updateState({ attendanceData, holidays, results, step: "dashboard" });
    },
    [state.uniqueSubjects, state.timetable, updateState]
  );

  const handleReset = useCallback(() => {
    setState(initialState);
  }, []);

  const handleBack = useCallback(() => {
    const steps: AppState["step"][] = [
      "landing",
      "upload",
      "timetable",
      "attendance",
      "dashboard",
    ];
    const idx = steps.indexOf(state.step);
    if (idx > 0) {
      updateState({ step: steps[idx - 1] });
    }
  }, [state.step, updateState]);

  return (
    <main className="min-h-dvh bg-bg dot-grid">
      {state.step === "landing" && (
        <LandingPage onStart={() => updateState({ step: "upload" })} />
      )}

      {state.step === "upload" && (
        <UploadPage
          onExtractComplete={handleExtractComplete}
          onBack={handleBack}
        />
      )}

      {state.step === "timetable" && (
        <TimetablePage
          timetable={state.timetable}
          imagePreview={state.imagePreview}
          slotDurationMinutes={state.slotDurationMinutes}
          onConfirm={handleTimetableConfirm}
          onBack={handleBack}
        />
      )}

      {state.step === "attendance" && (
        <AttendancePage
          subjects={state.uniqueSubjects}
          onSubmit={handleAttendanceSubmit}
          onBack={handleBack}
        />
      )}

      {state.step === "dashboard" && (
        <DashboardPage
          results={state.results}
          onReset={handleReset}
          onBack={handleBack}
        />
      )}
    </main>
  );
}
