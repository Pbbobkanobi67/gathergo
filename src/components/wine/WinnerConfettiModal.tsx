"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/avatar";
import { CONTEST_TYPES, HOOD_BUCKS } from "@/constants";
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

interface WinnerConfettiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: RevealResults | null;
  contestType: string;
}

function PodiumEntry({ result, place, height }: { result: PlaceResult | null; place: number; height: string }) {
  if (!result) return null;
  const name = result.submittedBy?.user?.name || result.submittedBy?.guestName || "Unknown";
  const medal = place === 1 ? "\u{1F947}" : place === 2 ? "\u{1F948}" : "\u{1F949}";
  const colors = place === 1
    ? "border-amber-500/50 bg-amber-500/10"
    : place === 2
    ? "border-slate-400/50 bg-slate-400/10"
    : "border-orange-500/50 bg-orange-500/10";

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <UserAvatar
        name={name}
        src={result.submittedBy?.user?.avatarUrl}
        size="md"
      />
      <div className={`w-full rounded-t-lg border ${colors} p-3 text-center ${height}`}>
        <p className="text-2xl">{medal}</p>
        <p className="text-sm font-bold text-slate-100 truncate">{result.wineName}</p>
        {result.winery && <p className="text-xs text-slate-400 truncate">{result.winery}</p>}
        <p className="text-xs text-slate-300 mt-1">{name}</p>
        <p className="text-xs text-amber-400 mt-1">
          Avg: {result.avgScore.toFixed(1)}/10
        </p>
      </div>
    </div>
  );
}

export function WinnerConfettiModal({ open, onOpenChange, results, contestType }: WinnerConfettiModalProps) {
  const typeInfo = CONTEST_TYPES.find((t) => t.value === contestType) || CONTEST_TYPES[0];

  useEffect(() => {
    if (open && results?.winner) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, results]);

  if (!results) return null;

  const winnerName = results.winner?.submittedBy?.user?.name || results.winner?.submittedBy?.guestName || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-amber-400" />
            {typeInfo.emoji} Winner Revealed!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Winner highlight */}
          {results.winner && (
            <div className="text-center">
              <p className="text-3xl mb-2">{typeInfo.emoji}</p>
              <p className="text-lg font-bold text-amber-400">{results.winner.wineName}</p>
              {results.winner.winery && (
                <p className="text-sm text-slate-400">{results.winner.winery}</p>
              )}
              <p className="text-sm text-slate-300 mt-1">by {winnerName}</p>
              <p className="text-xs text-amber-400 mt-1">
                Avg Score: {results.winner.avgScore.toFixed(1)}/10 ({results.winner.totalVoters} voters)
              </p>
            </div>
          )}

          {/* Podium */}
          <div className="flex items-end justify-center gap-2 pt-4">
            <PodiumEntry result={results.second} place={2} height="min-h-[120px]" />
            <PodiumEntry result={results.winner} place={1} height="min-h-[150px]" />
            <PodiumEntry result={results.third} place={3} height="min-h-[100px]" />
          </div>

          {/* Best Palate */}
          {results.bestPalate && (
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">Best Palate Award</span>
              </div>
              <div className="flex items-center gap-2">
                <UserAvatar name={results.bestPalate.memberName} src={results.bestPalate.avatarUrl} size="sm" />
                <span className="text-sm text-slate-200">{results.bestPalate.memberName}</span>
              </div>
              <p className="text-[10px] text-purple-400/70 mt-1">
                Closest match to the group consensus
              </p>
            </div>
          )}

          {/* Hood Bucks Awards */}
          {results.hoodBucksAwards && results.hoodBucksAwards.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-300 mb-2">
                {HOOD_BUCKS.CURRENCY_ICON} Hood Bucks Awarded
              </p>
              <div className="space-y-1">
                {results.hoodBucksAwards.map((award, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{award.place}: {award.memberName}</span>
                    <span className="font-bold text-amber-400">+{award.amount} {HOOD_BUCKS.CURRENCY_SYMBOL}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500">
            {results.totalScores} scores across {results.totalEntries} entries
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            View Full Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
