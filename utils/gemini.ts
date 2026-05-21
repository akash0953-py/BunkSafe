import { GeminiTimetableResponse, TimetableDay, TimetableEntry } from "@/types";

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Convert the raw Gemini JSON response into the app's TimetableDay[] structure.
 * Only days that have at least one subject are included.
 */
export function parseGeminiResponse(data: GeminiTimetableResponse): TimetableDay[] {
  const timetable: TimetableDay[] = [];

  for (const day of DAYS_ORDER) {
    const slots = data[day];
    if (!slots || slots.length === 0) continue;

    const subjects: TimetableEntry[] = slots
      .filter((s) => s.subject && s.subject.trim().length > 0)
      .map((s) => ({
        name: s.subject.trim(),
        classesPerSlot: Math.max(1, Math.round(s.classes ?? 1)),
      }));

    if (subjects.length > 0) {
      timetable.push({ day, subjects });
    }
  }

  return timetable;
}

/**
 * Extract a deduplicated list of unique subject names from the timetable.
 */
export function extractUniqueSubjects(timetable: TimetableDay[]): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];

  for (const day of timetable) {
    for (const entry of day.subjects) {
      const key = entry.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push(entry.name);
      }
    }
  }

  return subjects;
}

/**
 * Build a map of subjectName → total classes per week.
 * Accounts for classesPerSlot (e.g. a lab that appears once but counts as 2 classes).
 */
export function buildWeeklyCountMap(
  timetable: TimetableDay[]
): Record<string, number> {
  const map: Record<string, number> = {};

  for (const day of timetable) {
    for (const entry of day.subjects) {
      const key = entry.name;
      map[key] = (map[key] ?? 0) + entry.classesPerSlot;
    }
  }

  return map;
}

/**
 * Returns true if the timetable has any Saturday entries,
 * which means the college has a 6-day working week.
 */
export function hasSaturday(timetable: TimetableDay[]): boolean {
  return timetable.some((d) => d.day === "Saturday");
}
