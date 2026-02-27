"use client";

import { Check } from "lucide-react";
import { WINE_EVENT_STATUSES } from "@/constants";

interface ContestStepperProps {
  currentStatus: string;
}

const STATUS_ORDER = ["SETUP", "OPEN", "SCORING", "REVEAL", "COMPLETE"];

export function ContestStepper({ currentStatus }: ContestStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between gap-1 sm:gap-2">
      {WINE_EVENT_STATUSES.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.value} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isComplete
                    ? "border-teal-500 bg-teal-500/20 text-teal-400"
                    : isCurrent
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : "border-slate-600 bg-slate-800 text-slate-500"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                  isComplete
                    ? "text-teal-400"
                    : isCurrent
                    ? "text-amber-400"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  i < currentIndex ? "bg-teal-500/50" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
