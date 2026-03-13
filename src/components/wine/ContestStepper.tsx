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
                    ? "border-[#C9A040] bg-[#C9A040]/20 text-[#C9A040]"
                    : isCurrent
                    ? "border-[#C9A040] bg-[#C9A040]/10 text-[#C9A040] ring-2 ring-[#C9A040]/20"
                    : "border-[#A08060]/30 bg-[#2A0A0E] text-[#A08060]/60"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                  isComplete
                    ? "text-[#C9A040]"
                    : isCurrent
                    ? "text-[#C9A040]"
                    : "text-[#A08060]/60"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  i < currentIndex ? "bg-[#C9A040]/50" : "bg-[#A08060]/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
