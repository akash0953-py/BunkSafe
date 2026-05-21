import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiTimetableResponse } from "@/types";

const GEMINI_PROMPT = `You are an expert at reading college timetables.

Analyze this college timetable image carefully and extract the weekly schedule.

RULES:
1. Detect every day of the week present (Monday to Saturday).
2. For each day, list every subject/course that appears.
3. Detect the lecture slot duration from the timetable (common values: 40, 50, 60, 90, 120 minutes).
4. If a subject spans multiple consecutive time slots, count each slot as a separate class (e.g. a lab from 9am-11am with 1-hour slots = classes: 2).
5. Count ONLY actual teaching slots — completely IGNORE: Lunch, Break, Recess, Free Period, Library, Sports, Empty cells, Gaps.
6. If the same subject appears multiple times on the same day, include it multiple times.
7. Subject names should be clean and properly capitalised (e.g. "Data Structures", "Engineering Maths", "Physics Lab").

OUTPUT FORMAT — return ONLY valid JSON with no markdown fences, no explanation, nothing else:
{
  "slotDurationMinutes": 60,
  "Monday": [
    { "subject": "Engineering Maths", "classes": 1 },
    { "subject": "Physics Lab", "classes": 2 }
  ],
  "Tuesday": [
    { "subject": "Data Structures", "classes": 1 }
  ]
}

Only include days that have at least one subject. Return ONLY the JSON object.`;

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validateGeminiResponse(data: unknown): data is GeminiTimetableResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.slotDurationMinutes !== "number") return false;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const day of days) {
    if (day in obj) {
      if (!Array.isArray(obj[day])) return false;
      const slots = obj[day] as unknown[];
      for (const slot of slots) {
        if (
          typeof slot !== "object" ||
          slot === null ||
          typeof (slot as Record<string, unknown>).subject !== "string" ||
          typeof (slot as Record<string, unknown>).classes !== "number"
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageBase64, mimeType } = body as {
      imageBase64: string;
      mimeType: string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or mimeType in request body." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, // low temperature for structured extraction
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType as "image/png" | "image/jpeg",
        },
      },
      GEMINI_PROMPT,
    ]);

    const rawText = result.response.text();
    const cleaned = stripJsonFences(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Gemini returned non-JSON:", rawText);
      return NextResponse.json(
        {
          error: "Internal server error. Please try again later.",
        },
        { status: 500 }  // 422
      );
      // return NextResponse.json(
      //   {
      //     error: "AI returned an unexpected format. Please try again or use a clearer image.",
      //     // raw: rawText.slice(0, 500),
      //   },
      //   { status: 422 }
      // );
    }

    if (!validateGeminiResponse(parsed)) {
      console.error("Invalid Gemini response:", cleaned);
      return NextResponse.json(
        {
          error: "Internal server error. Please try again later.",
        },
        { status: 500 } // 422
      );
      // return NextResponse.json(
      //   {
      //     error: "AI response was invalid. Please try again.",
      //     raw: cleaned.slice(0, 500),
      //   },
      //   { status: 422 }
      // );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
  
    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
  // catch (err: unknown) {
  //   console.error("Gemini API error:", err);
  //   const message =
  //     err instanceof Error ? err.message : "Unknown error occurred.";
  //   return NextResponse.json({ error: message }, { status: 500 });
  // }
}
