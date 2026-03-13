"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Brain, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { HOOD_BUCKS, CONTEST_TYPES } from "@/constants";
import type { BestPalateResult, HoodBucksAwardSummary } from "@/types";

interface PlaceResult {
  entryId: string;
  bagNumber: number | null;
  wineName: string;
  winery: string | null;
  avgScore: number;
  totalVoters: number;
  submittedBy: {
    user?: { id: string; name: string; avatarUrl: string | null } | null;
    guestName?: string | null;
  } | null;
}

interface RevealResults {
  winner: PlaceResult | null;
  second: PlaceResult | null;
  third: PlaceResult | null;
  totalScores: number;
  totalEntries: number;
  bestPalate: BestPalateResult | null;
  hoodBucksAwards: HoodBucksAwardSummary[];
}

interface RevealSequenceProps {
  results: RevealResults;
  contestType: string;
  onComplete: () => void;
}

function PlaceRevealCard({ result, place, medal, color }: { result: PlaceResult; place: string; medal: string; color: string }) {
  const name = result.submittedBy?.user?.name || result.submittedBy?.guestName || "Unknown";

  return (
    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-6xl">{medal}</p>
      <p className={`text-sm font-medium uppercase tracking-widest ${color}`}>{place}</p>
      <div>
        <p className="text-2xl font-bold text-slate-100">Bag #{result.bagNumber}</p>
        <p className="text-lg text-amber-400 font-semibold mt-1">
          {result.avgScore.toFixed(1)}<span className="text-sm text-slate-400">/10</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">{result.totalVoters} votes</p>
      </div>
      <div className="pt-3 border-t border-slate-700">
        <p className="text-lg font-semibold text-slate-200">{result.wineName}</p>
        {result.winery && <p className="text-sm text-slate-400">{result.winery}</p>}
        <div className="flex items-center justify-center gap-2 mt-2">
          <UserAvatar name={name} src={result.submittedBy?.user?.avatarUrl} size="sm" />
          <span className="text-sm text-slate-300">{name}</span>
        </div>
      </div>
    </div>
  );
}

export function RevealSequence({ results, contestType, onComplete }: RevealSequenceProps) {
  const [step, setStep] = useState(0);
  const typeInfo = CONTEST_TYPES.find((t) => t.value === contestType) || CONTEST_TYPES[0];

  // Total steps: intro(0) + 3rd(1) + 2nd(2) + 1st(3) + bestPalate(4) + summary(5)
  const hasThird = !!results.third;
  const hasSecond = !!results.second;
  const hasBestPalate = !!results.bestPalate;

  const steps: { key: string; content: React.ReactNode }[] = [];

  // Step 0: Intro
  steps.push({
    key: "intro",
    content: (
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <p className="text-7xl">🍾</p>
        <p className="text-2xl font-bold text-slate-100">Time to Reveal!</p>
        <p className="text-sm text-slate-400">The scores are in. Let&apos;s see who won...</p>
      </div>
    ),
  });

  // Step 1: 3rd place
  if (hasThird) {
    steps.push({
      key: "third",
      content: <PlaceRevealCard result={results.third!} place="Third Place" medal="🥉" color="text-orange-400" />,
    });
  }

  // Step 2: 2nd place
  if (hasSecond) {
    steps.push({
      key: "second",
      content: <PlaceRevealCard result={results.second!} place="Second Place" medal="🥈" color="text-slate-300" />,
    });
  }

  // Step 3: 1st place
  if (results.winner) {
    steps.push({
      key: "first",
      content: <PlaceRevealCard result={results.winner} place="First Place" medal="🥇" color="text-amber-400" />,
    });
  }

  // Step 4: Best Palate
  if (hasBestPalate) {
    steps.push({
      key: "palate",
      content: (
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Brain className="h-16 w-16 text-purple-400 mx-auto" />
          <p className="text-sm font-medium uppercase tracking-widest text-purple-400">Best Palate Award</p>
          <p className="text-xs text-slate-500">Closest match to group consensus</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <UserAvatar name={results.bestPalate!.memberName} src={results.bestPalate!.avatarUrl} size="lg" />
            <div className="text-left">
              <p className="text-xl font-bold text-slate-100">{results.bestPalate!.memberName}</p>
              <p className="text-xs text-purple-400">Distance: {results.bestPalate!.spearmanDistance.toFixed(1)}</p>
            </div>
          </div>
        </div>
      ),
    });
  }

  // Step 5: Summary
  steps.push({
    key: "summary",
    content: (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="text-center">
          <p className="text-4xl mb-2">{typeInfo.emoji}</p>
          <p className="text-xl font-bold text-slate-100">Final Results</p>
          <p className="text-xs text-slate-500 mt-1">
            {results.totalScores} tasters &middot; {results.totalEntries} bottles
          </p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3">
          {results.second && (
            <div className="flex-1 text-center">
              <p className="text-2xl">🥈</p>
              <div className="rounded-t-lg border border-slate-400/30 bg-slate-400/10 p-2 min-h-[80px]">
                <p className="text-xs font-bold text-slate-200 truncate">{results.second.wineName}</p>
                <p className="text-xs text-amber-400">{results.second.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          {results.winner && (
            <div className="flex-1 text-center">
              <p className="text-3xl">🥇</p>
              <div className="rounded-t-lg border border-amber-500/30 bg-amber-500/10 p-2 min-h-[100px]">
                <p className="text-sm font-bold text-slate-100 truncate">{results.winner.wineName}</p>
                <p className="text-sm text-amber-400 font-bold">{results.winner.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          {results.third && (
            <div className="flex-1 text-center">
              <p className="text-xl">🥉</p>
              <div className="rounded-t-lg border border-orange-500/30 bg-orange-500/10 p-2 min-h-[60px]">
                <p className="text-xs font-bold text-slate-200 truncate">{results.third.wineName}</p>
                <p className="text-xs text-amber-400">{results.third.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hood Bucks */}
        {results.hoodBucksAwards && results.hoodBucksAwards.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-amber-300 mb-3">
              {HOOD_BUCKS.CURRENCY_ICON} Hood Bucks Awarded
            </p>
            <div className="space-y-2">
              {results.hoodBucksAwards.map((award, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{award.place}</span>
                  <span className="text-sm text-slate-200">{award.memberName}</span>
                  <span className="text-sm font-bold text-amber-400">+{award.amount} {HOOD_BUCKS.CURRENCY_SYMBOL}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
  });

  // Fire confetti on 1st place reveal
  useEffect(() => {
    const currentStep = steps[step];
    if (currentStep?.key === "first") {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isLastStep = step === steps.length - 1;

  return (
    <Card className="border-amber-500/20 bg-slate-800/90">
      <CardContent className="pt-8 pb-6 px-6 min-h-[300px] flex flex-col items-center justify-center">
        {steps[step]?.content}

        <div className="mt-8 w-full">
          {!isLastStep ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="w-full gap-2"
              variant="amber"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="w-full"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Full Results
            </Button>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-amber-400" : i < step ? "w-1.5 bg-amber-400/50" : "w-1.5 bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
