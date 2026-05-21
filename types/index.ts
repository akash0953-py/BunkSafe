// A single subject slot within a day
export interface TimetableEntry {
  name: string;
  classesPerSlot: number; // 1 for normal, 2 for labs spanning 2 consecutive slots, etc.
}

export interface TimetableDay {
  day: string;
  subjects: TimetableEntry[];
}

// Raw shape returned by Gemini
export interface GeminiSubjectSlot {
  subject: string;
  classes: number;
}

export interface GeminiTimetableResponse {
  slotDurationMinutes: number;
  Monday?: GeminiSubjectSlot[];
  Tuesday?: GeminiSubjectSlot[];
  Wednesday?: GeminiSubjectSlot[];
  Thursday?: GeminiSubjectSlot[];
  Friday?: GeminiSubjectSlot[];
  Saturday?: GeminiSubjectSlot[];
}

export interface AttendanceEntry {
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface SubjectResult {
  subjectName: string;
  percentage: number;
  status: "safe" | "warning" | "danger";
  safeBunks: number;        // of remaining semester classes
  classesToAttend: number;  // consecutive classes to recover to 76%
  predictedFinal: number;   // % if attend all remaining
  weeklyCount: number;      // total class slots per week
  semesterTotal: number;    // estimated full-semester class count
  minRequired: number;      // minimum to attend for 76%
  remainingClasses: number; // estimated classes left in semester
  attended: number;         // from user input
  totalHeld: number;        // from user input
}

export interface AppState {
  step: "landing" | "upload" | "timetable" | "attendance" | "dashboard";
  imageFile: File | null;
  imagePreview: string | null;
  slotDurationMinutes: number;
  timetable: TimetableDay[];
  uniqueSubjects: string[];
  holidays: number;
  attendanceData: Record<string, { attended: number; total: number }>;
  results: SubjectResult[];
}
