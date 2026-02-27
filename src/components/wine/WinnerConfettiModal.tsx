"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/avatar";
import { CONTEST_TYPES } from "@/constants";

interface PlaceResult {
  entryId: string;
  bagNumber: number | null;
  wineName: string;
  winery: string | null;
  points: number;
  avgRating: number;
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
        <p className="text-xs text-amber-400 mt-1">{result.points} pts</p>
      </div>
    </div>
  );
}

export function WinnerConfettiModal({ open, onOpenChange, results, contestType }: WinnerConfettiModalProps) {
  const typeInfo = CONTEST_TYPES.find((t) => t.value === contestType) || CONTEST_TYPES[0];

  useEffect(() => {
    if (open && results?.winner) {
      // Fire confetti
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
                {results.winner.points} pts | Avg: {results.winner.avgRating.toFixed(1)} stars
              </p>
            </div>
          )}

          {/* Podium */}
          <div className="flex items-end justify-center gap-2 pt-4">
            <PodiumEntry result={results.second} place={2} height="min-h-[120px]" />
            <PodiumEntry result={results.winner} place={1} height="min-h-[150px]" />
            <PodiumEntry result={results.third} place={3} height="min-h-[100px]" />
          </div>

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
