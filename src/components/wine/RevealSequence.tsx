"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Brain, ChevronRight } from "lucide-react";
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
    <div className="text-center space-y-4 animate-slideUp">
      <p className="text-6xl">{medal}</p>
      <p className={`text-sm font-medium uppercase tracking-[0.15em] ${color}`}>{place}</p>
      <div>
        <p className="font-wine text-3xl font-bold text-[#F0E3C7]">Bottle #{result.bagNumber}</p>
        <p className="font-wine text-2xl text-[#C9A040] font-bold mt-1">
          {result.avgScore.toFixed(1)}<span className="text-sm text-[#A08060]">/10</span>
        </p>
        <p className="text-xs text-[#A08060] mt-1">{result.totalVoters} votes</p>
      </div>
      <div className="pt-3 border-t border-[#C9A040]/15">
        <p className="font-wine text-lg font-semibold text-[#F0E3C7]">{result.wineName}</p>
        {result.winery && <p className="text-sm text-[#A08060]">{result.winery}</p>}
        <div className="flex items-center justify-center gap-2 mt-2">
          <UserAvatar name={name} src={result.submittedBy?.user?.avatarUrl} size="sm" />
          <span className="text-sm text-[#C4A882]">{name}</span>
        </div>
      </div>
    </div>
  );
}

export function RevealSequence({ results, contestType, onComplete }: RevealSequenceProps) {
  const [step, setStep] = useState(0);
  const typeInfo = CONTEST_TYPES.find((t) => t.value === contestType) || CONTEST_TYPES[0];

  const hasThird = !!results.third;
  const hasSecond = !!results.second;
  const hasBestPalate = !!results.bestPalate;

  const steps: { key: string; content: React.ReactNode }[] = [];

  // Step 0: Intro
  steps.push({
    key: "intro",
    content: (
      <div className="text-center space-y-6 animate-fadeIn">
        <p className="text-7xl">🍾</p>
        <p className="font-wine text-3xl font-bold text-[#C9A040]">The Moment of Truth</p>
        <p className="text-sm text-[#A08060] italic">The scores are in. Let&apos;s see who won...</p>
      </div>
    ),
  });

  // 3rd place
  if (hasThird) {
    steps.push({
      key: "third",
      content: <PlaceRevealCard result={results.third!} place="Third Place" medal="🥉" color="text-orange-400" />,
    });
  }

  // 2nd place
  if (hasSecond) {
    steps.push({
      key: "second",
      content: <PlaceRevealCard result={results.second!} place="Second Place" medal="🥈" color="text-slate-300" />,
    });
  }

  // 1st place
  if (results.winner) {
    steps.push({
      key: "first",
      content: <PlaceRevealCard result={results.winner} place="Champion" medal="🥇" color="text-[#C9A040]" />,
    });
  }

  // Best Palate
  if (hasBestPalate) {
    steps.push({
      key: "palate",
      content: (
        <div className="text-center space-y-4 animate-slideUp">
          <p className="text-5xl">🎯</p>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-purple-400">Best Palate Award</p>
          <p className="text-xs text-[#A08060]">Closest to group consensus</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <UserAvatar name={results.bestPalate!.memberName} src={results.bestPalate!.avatarUrl} size="lg" />
            <div className="text-left">
              <p className="font-wine text-xl font-bold text-[#F0E3C7]">{results.bestPalate!.memberName}</p>
              <p className="text-xs text-purple-400">Distance: {results.bestPalate!.spearmanDistance.toFixed(1)}</p>
            </div>
          </div>
        </div>
      ),
    });
  }

  // Summary
  steps.push({
    key: "summary",
    content: (
      <div className="space-y-6 animate-fadeIn">
        <div className="text-center">
          <p className="text-4xl mb-2">{typeInfo.emoji}</p>
          <p className="font-wine text-2xl font-bold text-[#C9A040]">Final Results</p>
          <p className="text-xs text-[#A08060] mt-1">
            {results.totalScores} tasters &middot; {results.totalEntries} bottles
          </p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3">
          {results.second && (
            <div className="flex-1 text-center">
              <p className="text-2xl">🥈</p>
              <div className="rounded-t-lg border border-slate-400/20 bg-slate-400/5 p-2 min-h-[80px]">
                <p className="text-xs font-bold text-[#F0E3C7] truncate font-wine">{results.second.wineName}</p>
                <p className="text-xs text-[#C9A040] font-wine">{results.second.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          {results.winner && (
            <div className="flex-1 text-center">
              <p className="text-3xl">🥇</p>
              <div className="rounded-t-lg border border-[#C9A040]/30 bg-[#C9A040]/10 p-2 min-h-[100px]">
                <p className="text-sm font-bold text-[#F0E3C7] truncate font-wine">{results.winner.wineName}</p>
                <p className="text-sm text-[#C9A040] font-bold font-wine">{results.winner.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          {results.third && (
            <div className="flex-1 text-center">
              <p className="text-xl">🥉</p>
              <div className="rounded-t-lg border border-orange-500/20 bg-orange-500/5 p-2 min-h-[60px]">
                <p className="text-xs font-bold text-[#F0E3C7] truncate font-wine">{results.third.wineName}</p>
                <p className="text-xs text-[#C9A040] font-wine">{results.third.avgScore.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hood Bucks */}
        {results.hoodBucksAwards && results.hoodBucksAwards.length > 0 && (
          <div className="rounded-xl border border-[#C9A040]/20 bg-[#C9A040]/5 p-4">
            <p className="text-sm font-semibold text-[#C9A040] mb-3 font-wine">
              {HOOD_BUCKS.CURRENCY_ICON} Hood Bucks Awarded
            </p>
            <div className="space-y-2">
              {results.hoodBucksAwards.map((award, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[#C4A882]">{award.place}</span>
                  <span className="text-sm text-[#F0E3C7]">{award.memberName}</span>
                  <span className="text-sm font-bold text-[#C9A040]">+{award.amount} {HOOD_BUCKS.CURRENCY_SYMBOL}</span>
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
    <div className="wine-card-gold p-6 space-y-6">
      <div className="min-h-[280px] flex items-center justify-center">
        {steps[step]?.content}
      </div>

      <div className="space-y-4">
        {!isLastStep ? (
          <button onClick={() => setStep(step + 1)} className="wine-btn">
            {step === 0 ? "Reveal 3rd Place" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={onComplete} className="wine-btn">
            <Trophy className="h-4 w-4" />
            View Full Results
          </button>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-[#C9A040]" : i < step ? "w-1.5 bg-[#C9A040]/50" : "w-1.5 bg-[#A08060]/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
