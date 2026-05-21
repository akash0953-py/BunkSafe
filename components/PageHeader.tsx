"use client";

import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
}

export default function PageHeader({ title, onBack, step, totalSteps }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3 px-5 py-4 max-w-lg mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:border-accent/50 transition-colors active:scale-90 flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-white text-lg leading-tight truncate">
            {title}
          </h2>
          {step && totalSteps && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < step ? "bg-accent w-5" : "bg-border w-3"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted text-xs font-mono">
                {step}/{totalSteps}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
