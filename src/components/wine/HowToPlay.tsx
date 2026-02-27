"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CONTEST_TYPES } from "@/constants";

interface HowToPlayProps {
  contestType: string;
  customInstructions?: string | null;
  status: string;
}

const GENERIC_STEPS = [
  { phase: "Submit", desc: "Each person privately submits their entries. Nobody else can see what you brought." },
  { phase: "Bag Up", desc: "The host covers/bags all entries and assigns bag numbers so they're anonymous." },
  { phase: "Taste", desc: "Everyone tastes each bag blind and rates them 1-5 stars, then picks their top 3." },
  { phase: "Reveal", desc: "The host reveals results - confetti, winner, and all entries unmasked!" },
];

export function HowToPlay({ contestType, customInstructions, status }: HowToPlayProps) {
  const [isOpen, setIsOpen] = useState(status === "SETUP" || status === "OPEN");
  const typeInfo = CONTEST_TYPES.find((t) => t.value === contestType) || CONTEST_TYPES[0];

  return (
    <Card className="border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">How It Works</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <CardContent className="border-t border-slate-700 pt-4">
          <div className="space-y-3">
            {GENERIC_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{step.phase}</p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {contestType === "WINE" && (
            <div className="mt-4 rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
              <p className="text-xs text-purple-300">
                {typeInfo.emoji} <strong>Tip:</strong> Use numbered wine bags to keep things blind. You can find packs on Amazon by searching &quot;blind wine tasting bags&quot;.
              </p>
            </div>
          )}

          {customInstructions && (
            <div className="mt-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs font-semibold text-blue-300 mb-1">Host Instructions</p>
              <p className="text-xs text-blue-200 whitespace-pre-wrap">{customInstructions}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
