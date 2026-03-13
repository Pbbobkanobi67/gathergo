"use client";

import { useState, useEffect } from "react";
import { Trophy, Hash, Grape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { WINE_SCORE_MIN, WINE_SCORE_MAX, WINE_SCORE_STEP, getScoreLabel, WINE_TYPES, PRICE_RANGES, WINE_VARIETALS } from "@/constants";
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
  wineType: string;
  grapeGuess: string;
  priceRangeGuess: string;
}

export function WineScoringModal({ open, onOpenChange, tripId, eventId, entries }: WineScoringModalProps) {
  const submitScore = useSubmitWineScore();

  // Only show entries that have bag numbers assigned
  const scorableEntries = entries.filter((e) => e.bagNumber !== null && e.bagNumber !== undefined);

  const [tasteNotes, setTasteNotes] = useState<Record<string, EntryRating>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, EntryRating> = {};
      scorableEntries.forEach((e) => {
        initial[e.id] = { rating: 0, notes: "", wineType: "", grapeGuess: "", priceRangeGuess: "" };
      });
      setTasteNotes(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateField = (entryId: string, field: keyof EntryRating, value: string | number) => {
    setTasteNotes((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], [field]: value },
    }));
  };

  const allRated = scorableEntries.every((e) => tasteNotes[e.id]?.rating > 0);

  const handleSubmit = async () => {
    if (!allRated) return;
    try {
      await submitScore.mutateAsync({
        tripId,
        eventId,
        tasteNotes,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  // Filter varietals for autocomplete
  const [activeGrapeInput, setActiveGrapeInput] = useState<string | null>(null);
  const getFilteredVarietals = (query: string) => {
    if (!query) return [];
    return WINE_VARIETALS.filter((v) =>
      v.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Score Wines
          </DialogTitle>
          <DialogDescription>
            Rate each entry 1-10 (half-points allowed). Winners determined by average score.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {scorableEntries.map((entry) => {
            const rating = tasteNotes[entry.id]?.rating || 0;
            const grapeQuery = tasteNotes[entry.id]?.grapeGuess || "";
            const filteredVarietals = activeGrapeInput === entry.id ? getFilteredVarietals(grapeQuery) : [];

            return (
              <div key={entry.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-sm font-bold text-purple-400">
                    <Hash className="mr-0.5 h-3 w-3" />
                    {entry.bagNumber}
                  </div>
                  <span className="font-medium text-slate-200">Bag #{entry.bagNumber}</span>
                </div>

                {/* Score slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Score</span>
                    <span className="text-lg font-bold text-amber-400">
                      {rating > 0 ? rating.toFixed(1) : "--"}
                      <span className="text-xs text-slate-500 font-normal ml-1">/ 10</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={WINE_SCORE_MIN}
                    max={WINE_SCORE_MAX}
                    step={WINE_SCORE_STEP}
                    value={rating || WINE_SCORE_MIN}
                    onChange={(e) => updateField(entry.id, "rating", parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{WINE_SCORE_MIN}</span>
                    <span className="text-amber-400/70">{rating > 0 ? getScoreLabel(rating) : ""}</span>
                    <span>{WINE_SCORE_MAX}</span>
                  </div>
                </div>

                {/* Wine type tags */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Type (optional)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {WINE_TYPES.map((wt) => (
                      <button
                        key={wt.value}
                        type="button"
                        onClick={() => updateField(entry.id, "wineType", tasteNotes[entry.id]?.wineType === wt.value ? "" : wt.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          tasteNotes[entry.id]?.wineType === wt.value
                            ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                            : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:text-slate-300"
                        }`}
                      >
                        {wt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grape guess with autocomplete */}
                <div className="space-y-1 relative">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Grape className="h-3 w-3" />
                    Grape Guess (optional)
                  </span>
                  <Input
                    placeholder="e.g., Cabernet Sauvignon"
                    value={tasteNotes[entry.id]?.grapeGuess || ""}
                    onChange={(e) => updateField(entry.id, "grapeGuess", e.target.value)}
                    onFocus={() => setActiveGrapeInput(entry.id)}
                    onBlur={() => setTimeout(() => setActiveGrapeInput(null), 200)}
                    className="text-sm"
                  />
                  {filteredVarietals.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-lg">
                      {filteredVarietals.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-700"
                          onMouseDown={() => updateField(entry.id, "grapeGuess", v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price range guess */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Price Guess (optional)</span>
                  <Select
                    placeholder="Select range..."
                    options={PRICE_RANGES.map((p) => ({ value: p.value, label: p.label }))}
                    value={tasteNotes[entry.id]?.priceRangeGuess || ""}
                    onChange={(e) => updateField(entry.id, "priceRangeGuess", e.target.value)}
                  />
                </div>

                {/* Tasting notes */}
                <Input
                  placeholder="Tasting notes (optional)"
                  value={tasteNotes[entry.id]?.notes || ""}
                  onChange={(e) => updateField(entry.id, "notes", e.target.value)}
                  className="text-sm"
                />
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={submitScore.isPending}
            disabled={!allRated}
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
