"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { TimetableDay, GeminiTimetableResponse } from "@/types";
import { parseGeminiResponse } from "@/utils/gemini";
import { cn } from "@/utils/cn";
import PageHeader from "@/components/PageHeader";

interface Props {
  onExtractComplete: (
    timetable: TimetableDay[],
    slotDurationMinutes: number,
    file: File,
    preview: string
  ) => void;
  onBack: () => void;
}

type UploadState = "idle" | "preview" | "processing" | "done" | "error";

const AI_MESSAGES = [
  "Sending image to Gemini AI...",
  "Detecting lecture slots...",
  "Identifying subjects...",
  "Mapping your schedule...",
  "Almost there...",
];

export default function UploadPage({ onExtractComplete, onBack }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState(AI_MESSAGES[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle through AI messages during processing
  useEffect(() => {
    if (uploadState === "processing") {
      let idx = 0;
      setAiMessage(AI_MESSAGES[0]);
      msgIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % AI_MESSAGES.length;
        setAiMessage(AI_MESSAGES[idx]);
      }, 1800);
    } else {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    }
    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, [uploadState]);

  const handleFile = useCallback((f: File) => {
    if (!["image/png", "image/jpg", "image/jpeg"].includes(f.type)) {
      setError("Please upload a PNG or JPG image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image too large. Please use an image under 10MB.");
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setUploadState("preview");
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragActive(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleExtract = useCallback(async () => {
    if (!file || !preview) return;
    setUploadState("processing");
    setError(null);

    try {
      // Convert file to base64 (strip the data URL prefix)
      const base64 = preview.split(",")[1];
      const mimeType = file.type;

      const res = await fetch("/api/extract-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Network error" }));
        throw new Error(
          (errData as { error?: string }).error ?? `HTTP ${res.status}`
        );
      }

      const data: GeminiTimetableResponse = await res.json();
      const timetable = parseGeminiResponse(data);

      if (timetable.length === 0) {
        throw new Error(
          "No subjects detected. Please try a clearer image or add subjects manually."
        );
      }

      setUploadState("done");
      setTimeout(() => {
        onExtractComplete(timetable, data.slotDurationMinutes ?? 60, file, preview);
      }, 700);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "AI extraction failed. Please try again.";
      setError(msg);
      setUploadState("preview");
    }
  }, [file, preview, onExtractComplete]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setFile(null);
    setUploadState("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      <PageHeader title="Upload Timetable" onBack={onBack} step={1} totalSteps={4} />

      <div className="flex-1 px-5 py-6 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* Upload zone */}
        {uploadState === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer py-14 px-6 text-center",
              dragActive
                ? "border-accent bg-accent/10 scale-[1.01]"
                : "border-border hover:border-accent/50 hover:bg-card/50 bg-card/30"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              className="hidden"
              onChange={handleInputChange}
            />
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200",
                dragActive ? "bg-accent/20" : "bg-subtle"
              )}
            >
              <Upload
                size={28}
                className={dragActive ? "text-accent" : "text-muted"}
              />
            </div>
            <div>
              <p className="text-white font-display font-semibold text-lg mb-1">
                {dragActive ? "Drop it here!" : "Upload timetable image"}
              </p>
              <p className="text-muted text-sm">Drag & drop or tap to browse</p>
              <p className="text-muted/60 text-xs mt-2">PNG · JPG · JPEG · Max 10MB</p>
            </div>
          </div>
        )}

        {/* Image preview / processing / done */}
        {(uploadState === "preview" ||
          uploadState === "processing" ||
          uploadState === "done") &&
          preview && (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
              {/* Clear button */}
              {uploadState === "preview" && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-bg/80 backdrop-blur flex items-center justify-center border border-border hover:border-danger/50 hover:text-danger transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              <div className="relative">
                <img
                  src={preview}
                  alt="Timetable preview"
                  className={cn(
                    "w-full max-h-64 object-cover transition-all duration-300",
                    uploadState === "processing" && "opacity-30"
                  )}
                />

                {/* Processing overlay */}
                {uploadState === "processing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/40 backdrop-blur-sm">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                        <Sparkles size={24} className="text-accent animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/30 border border-accent/50 flex items-center justify-center">
                        <Loader2 size={10} className="text-accent animate-spin" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-display font-semibold text-sm mb-1">
                        AI is reading your timetable
                      </p>
                      <p className="text-accent/80 text-xs font-mono transition-all duration-500">
                        {aiMessage}
                      </p>
                    </div>
                    {/* Animated dots */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Done overlay */}
                {uploadState === "done" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/70 backdrop-blur-sm">
                    <CheckCircle2 size={36} className="text-safe" />
                    <p className="text-white font-display font-semibold text-sm">
                      Schedule extracted!
                    </p>
                  </div>
                )}
              </div>

              {/* File info row */}
              {uploadState === "preview" && (
                <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
                  <ImageIcon size={16} className="text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {file?.name}
                    </p>
                    <p className="text-muted text-xs">
                      {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/30 animate-fade-in">
            <X size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* AI badge */}
        {uploadState === "idle" && (
          <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles size={12} className="text-accent" />
              </div>
              <span className="text-white text-xs font-display font-semibold">
                Powered by Gemini Vision AI
              </span>
            </div>
            <p className="text-muted/70 text-xs leading-relaxed">
              Gemini Vision automatically detects subjects, lecture durations, lab
              slots, and your weekly schedule — no manual parsing needed. You can
              still edit anything after extraction.
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {uploadState === "preview" && (
        <div className="sticky bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-bg via-bg/90 to-transparent">
          <button
            onClick={handleExtract}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base rounded-2xl transition-all duration-200 glow-accent active:scale-95"
          >
            <Sparkles size={18} />
            Analyse with AI
          </button>
        </div>
      )}
    </div>
  );
}
