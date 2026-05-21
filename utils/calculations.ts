import { SubjectResult } from "@/types";
import { hasSaturday } from "@/utils/gemini";
import { TimetableDay } from "@/types";

/** Minimum attendance percentage required */
const MIN_ATTENDANCE = 0.76;

/** Total working days in a semester */
const SEMESTER_WORKING_DAYS = 60;

/**
 * Calculate full results for each subject.
 *
 * @param subjects        - Unique subject names
 * @param attendanceData  - Map of subject → { attended, total } from user
 * @param weeklyCountMap  - Map of subject → classes per week (from Gemini timetable)
 * @param holidays        - Number of holidays to subtract from semester working days
 * @param timetable       - Full timetable (to detect 5 vs 6-day week)
 */
export function calculateResults(
  subjects: string[],
  attendanceData: Record<string, { attended: number; total: number }>,
  weeklyCountMap: Record<string, number>,
  holidays: number,
  timetable: TimetableDay[]
): SubjectResult[] {
  const effectiveWorkingDays = Math.max(
    10,
    SEMESTER_WORKING_DAYS - Math.max(0, holidays)
  );
  const workingDaysPerWeek = hasSaturday(timetable) ? 6 : 5;
  const semesterWeeks = effectiveWorkingDays / workingDaysPerWeek;

  return subjects.map((subjectName) => {
    const data = attendanceData[subjectName] ?? { attended: 0, total: 1 };
    const { attended, total: totalHeld } = data;

    // Current attendance percentage (based on classes held so far)
    const percentage =
      totalHeld > 0 ? Math.round((attended / totalHeld) * 100) : 0;

    // Weekly class count (slots × classesPerSlot)
    const weeklyCount = weeklyCountMap[subjectName] ?? 1;

    // Estimated full-semester class count
    const semesterTotal = Math.round(weeklyCount * semesterWeeks);

    // Minimum classes to attend for 76% of the full semester
    const minRequired = Math.ceil(semesterTotal * MIN_ATTENDANCE);

    // Remaining classes after what has already been held
    const remainingClasses = Math.max(0, semesterTotal - totalHeld);

    // --- Status ---
    let status: "safe" | "warning" | "danger";
    if (percentage < 76) {
      status = "danger";
    } else if (percentage < 81) {
      status = "warning";
    } else {
      status = "safe";
    }

    // --- Safe bunks from remaining classes ---
    // You need ceil(semesterTotal * 0.76) attended total by end of semester.
    // You already have `attended`. So you still need:
    //   stillNeeded = max(0, minRequired - attended)
    // Safe bunks = remainingClasses - stillNeeded
    const stillNeeded = Math.max(0, minRequired - attended);
    const safeBunks = Math.max(0, remainingClasses - stillNeeded);

    // --- Recovery: consecutive classes to attend to reach 76% of held ---
    // (attended + x) / (totalHeld + x) >= 0.76
    // x >= (0.76 * totalHeld - attended) / (1 - 0.76)
    const classesToAttend =
      percentage < 76
        ? Math.max(
            0,
            Math.ceil(
              (MIN_ATTENDANCE * totalHeld - attended) / (1 - MIN_ATTENDANCE)
            )
          )
        : 0;

    // --- Predicted final if attend all remaining ---
    const predictedFinal =
      semesterTotal > 0
        ? Math.min(
            100,
            Math.round(((attended + remainingClasses) / semesterTotal) * 100)
          )
        : percentage;

    return {
      subjectName,
      percentage,
      status,
      safeBunks,
      classesToAttend,
      predictedFinal,
      weeklyCount,
      semesterTotal,
      minRequired,
      remainingClasses,
      attended,
      totalHeld,
    };
  });
}

export function getOverallStatus(
  results: SubjectResult[]
): "safe" | "warning" | "danger" {
  if (results.some((r) => r.status === "danger")) return "danger";
  if (results.some((r) => r.status === "warning")) return "warning";
  return "safe";
}

export function getAverageAttendance(results: SubjectResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(
    results.reduce((sum, r) => sum + r.percentage, 0) / results.length
  );
}
