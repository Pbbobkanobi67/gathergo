"use client";

import { useState, useEffect } from "react";
import { Star, Trophy, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSubmitWineScore } from "@/hooks/useWineEventDetail";
import { WINE_RATINGS } from "@/constants";
import type { WineEntryWithSubmitter } from "@/types";

interface WineScoringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  eventId: string;
  entries: WineEntryWithSubmitter[];
}

interface EntryRating {
  rating: number;
  notes: string;
}

export function WineScoringModal({ open, onOpenChange, tripId, eventId, entries }: WineScoringModalProps) {
  const submitScore = useSubmitWineScore();

  const [tasteNotes, setTasteNotes] = useState<Record<string, EntryRating>>({});
  const [rankings, setRankings] = useState({ first: "", second: "", third: "" });

  useEffect(() => {
    if (open) {
      const initial: Record<string, EntryRating> = {};
      entries.forEach((e) => {
        initial[e.id] = { rating: 0, notes: "" };
      });
      setTasteNotes(initial);
      setRankings({ first: "", second: "", third: "" });
    }
  }, [open, entries]);

  const setRating = (entryId: string, rating: number) => {
    setTasteNotes((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], rating },
    }));
  };

  const setNotes = (entryId: string, notes: string) => {
    setTasteNotes((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], notes },
    }));
  };

  const allRated = entries.every((e) => tasteNotes[e.id]?.rating > 0);
  const rankingsComplete = rankings.first && rankings.second && rankings.third;
  const canSubmit = allRated && rankingsComplete;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await submitScore.mutateAsync({
        tripId,
        eventId,
        rankings,
        tasteNotes,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const entryOptions = entries.map((e) => ({
    value: e.id,
    label: `Bag #${e.bagNumber}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Score Wines
          </DialogTitle>
          <DialogDescription>
            Rate each wine blind (by bag number only), then rank your top 3.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Per-entry ratings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Rate Each Wine</h3>
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-sm font-bold text-purple-400">
                    <Hash className="mr-0.5 h-3 w-3" />
                    {entry.bagNumber}
                  </div>
                  <span className="font-medium text-slate-200">Bag #{entry.bagNumber}</span>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1">
                  {WINE_RATINGS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(entry.id, r.value)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        tasteNotes[entry.id]?.rating >= r.value
                          ? "bg-amber-500/30 text-amber-400"
                          : "bg-slate-700/50 text-slate-500 hover:text-slate-300"
                      }`}
                      title={`${r.value} - ${r.label}`}
                    >
                      <Star className={`h-5 w-5 ${tasteNotes[entry.id]?.rating >= r.value ? "fill-current" : ""}`} />
                    </button>
                  ))}
                  {tasteNotes[entry.id]?.rating > 0 && (
                    <span className="ml-2 text-xs text-slate-400">
                      {WINE_RATINGS.find((r) => r.value === tasteNotes[entry.id]?.rating)?.label}
                    </span>
                  )}
                </div>

                {/* Notes */}
                <Input
                  placeholder="Tasting notes (optional)"
                  value={tasteNotes[entry.id]?.notes || ""}
                  onChange={(e) => setNotes(entry.id, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Rank Your Top 3</h3>
            <div className="space-y-2">
              <Label htmlFor="rank-first" required>1st Place</Label>
              <Select
                id="rank-first"
                placeholder="Select bag..."
                options={entryOptions}
                value={rankings.first}
                onChange={(e) => setRankings((r) => ({ ...r, first: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank-second" required>2nd Place</Label>
              <Select
                id="rank-second"
                placeholder="Select bag..."
                options={entryOptions}
                value={rankings.second}
                onChange={(e) => setRankings((r) => ({ ...r, second: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank-third" required>3rd Place</Label>
              <Select
                id="rank-third"
                placeholder="Select bag..."
                options={entryOptions}
                value={rankings.third}
                onChange={(e) => setRankings((r) => ({ ...r, third: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={submitScore.isPending}
            disabled={!canSubmit}
            className="gap-2"
            variant="amber"
          >
            <Trophy className="h-4 w-4" />
            Submit Scores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
