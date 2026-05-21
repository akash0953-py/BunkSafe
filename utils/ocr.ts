import { TimetableDay } from "@/types";

export async function runOCR(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const imageUrl = URL.createObjectURL(file);
  const { data } = await worker.recognize(imageUrl);
  await worker.terminate();
  URL.revokeObjectURL(imageUrl);

  return data.text;
}

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function isLikelySubject(token: string): boolean {
  const cleaned = token.trim();
  if (cleaned.length < 2) return false;
  // Skip pure numbers, single chars, common OCR noise
  if (/^\d+$/.test(cleaned)) return false;
  if (/^[^a-zA-Z]+$/.test(cleaned)) return false;
  // Skip time patterns
  if (/^\d{1,2}[:.-]\d{2}/.test(cleaned)) return false;
  return true;
}

function cleanSubjectName(raw: string): string {
  return raw
    .replace(/[|\\/_\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(capitalise)
    .join(" ");
}

export function parseTimetable(rawText: string): TimetableDay[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const timetable: TimetableDay[] = [];
  let currentDay: TimetableDay | null = null;
  const subjectsSeen = new Set<string>();

  // Build initial fallback subjects list in case OCR gives us a flat list
  const allTokens: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect weekday
    const matchedDay = WEEKDAYS.find((day) => lower.includes(day));
    if (matchedDay) {
      if (currentDay && currentDay.subjects.length > 0) {
        timetable.push(currentDay);
      }
      currentDay = { day: WEEKDAY_LABELS[matchedDay], subjects: [] };
      continue;
    }

    // Try splitting line into tokens by common separators
    const tokens = line
      .split(/[\t|,;]+/)
      .map((t) => t.trim())
      .filter(isLikelySubject);

    for (const token of tokens) {
      const name = cleanSubjectName(token);
      if (name.length < 2) continue;
      allTokens.push(name);
      if (currentDay) {
        const key = name.toLowerCase();
        if (!currentDay.subjects.map((s) => s.name.toLowerCase()).includes(key)) {
          currentDay.subjects.push({
            name: name,
            classesPerSlot: 1,
          });
          subjectsSeen.add(key);
        }
      }
    }
  }

  if (currentDay && currentDay.subjects.length > 0) {
    timetable.push(currentDay);
  }

  // If no days detected, build a fallback single-week structure
  if (timetable.length === 0 && allTokens.length > 0) {
    const unique = Array.from(
      new Set(allTokens.map((t) => t.toLowerCase()))
    ).map((t) => cleanSubjectName(t));
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const chunkSize = Math.ceil(unique.length / days.length);
    for (let i = 0; i < days.length; i++) {
      const chunk = unique.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        timetable.push({
  day: days[i],
  subjects: chunk.map((subject) => ({
    name: subject,
    classesPerSlot: 1,
  })),
});
      }
    }
  }

  return timetable;
}

export function extractUniqueSubjects(timetable: TimetableDay[]): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];
  for (const day of timetable) {
    for (const sub of day.subjects) {
      const key = sub.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push(sub.name);
      }
    }
  }
  return subjects;
}

export function countSubjectPerWeek(
  subjectName: string,
  timetable: TimetableDay[]
): number {
  let count = 0;
  for (const day of timetable) {
    for (const sub of day.subjects) {
      if (sub.name.toLowerCase() === subjectName.toLowerCase()) count++;
    }
  }
  return count || 1;
}
