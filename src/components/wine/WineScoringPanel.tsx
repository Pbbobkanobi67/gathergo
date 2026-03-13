"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Grape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSubmitWineScore } from "@/hooks/useWineEventDetail";
import { WINE_TYPES, PRICE_RANGES, WINE_VARIETALS } from "@/constants";
import type { WineEntryWithSubmitter } from "@/types";

interface WineScoringPanelProps {
  tripId: string;
  eventId: string;
  entries: WineEntryWithSubmitter[];
  existingNotes?: Record<string, { rating: number; notes?: string; wineType?: string; grapeGuess?: string; priceRangeGuess?: string }> | null;
  onComplete?: () => void;
}

interface EntryRating {
  rating: number;
  notes: string;
  wineType: string;
  grapeGuess: string;
  priceRangeGuess: string;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function WineScoringPanel({ tripId, eventId, entries, existingNotes, onComplete }: WineScoringPanelProps) {
  const submitScore = useSubmitWineScore();
  const scorableEntries = entries
    .filter((e) => e.bagNumber !== null && e.bagNumber !== undefined)
    .sort((a, b) => (a.bagNumber ?? 0) - (b.bagNumber ?? 0));

  const [activeIndex, setActiveIndex] = useState(0);
  const [tasteNotes, setTasteNotes] = useState<Record<string, EntryRating>>({});
  const [grapeDropdownOpen, setGrapeDropdownOpen] = useState(false);

  // Initialize from existing notes or empty
  useEffect(() => {
    const initial: Record<string, EntryRating> = {};
    scorableEntries.forEach((e) => {
      if (existingNotes && existingNotes[e.id]) {
        const n = existingNotes[e.id];
        initial[e.id] = {
          rating: n.rating || 0,
          notes: n.notes || "",
          wineType: n.wineType || "",
          grapeGuess: n.grapeGuess || "",
          priceRangeGuess: n.priceRangeGuess || "",
        };
      } else {
        initial[e.id] = { rating: 0, notes: "", wineType: "", grapeGuess: "", priceRangeGuess: "" };
      }
    });
    setTasteNotes(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingNotes]);

  const activeEntry = scorableEntries[activeIndex];
  const activeNotes = activeEntry ? tasteNotes[activeEntry.id] : null;

  const updateField = useCallback((field: keyof EntryRating, value: string | number) => {
    if (!activeEntry) return;
    setTasteNotes((prev) => ({
      ...prev,
      [activeEntry.id]: { ...prev[activeEntry.id], [field]: value },
    }));
  }, [activeEntry]);

  const scoredCount = scorableEntries.filter((e) => tasteNotes[e.id]?.rating > 0).length;
  const allScored = scoredCount === scorableEntries.length;

  const goNext = () => {
    if (activeIndex < scorableEntries.length - 1) setActiveIndex(activeIndex + 1);
  };
  const goPrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleSubmit = async () => {
    if (!allScored) return;
    try {
      await submitScore.mutateAsync({ tripId, eventId, tasteNotes });
      onComplete?.();
    } catch {
      // Error handled by mutation
    }
  };

  const filteredVarietals = activeNotes?.grapeGuess
    ? WINE_VARIETALS.filter((v) => v.toLowerCase().includes(activeNotes.grapeGuess.toLowerCase())).slice(0, 5)
    : [];

  if (scorableEntries.length === 0) {
    return (
      <Card className="border-slate-700">
        <CardContent className="pt-6 text-center text-sm text-slate-500">
          No bags assigned yet. The host needs to assign bag numbers.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          Scoring: {scoredCount}/{scorableEntries.length} bottles
        </span>
        {allScored && (
          <Button
            onClick={handleSubmit}
            isLoading={submitScore.isPending}
            variant="amber"
            size="sm"
            className="gap-1"
          >
            <Check className="h-4 w-4" />
            {existingNotes ? "Update Scores" : "Submit All Scores"}
          </Button>
        )}
      </div>

      {/* Bottle selector grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {scorableEntries.map((entry, idx) => {
          const isActive = idx === activeIndex;
          const isScored = tasteNotes[entry.id]?.rating > 0;
          return (
            <button
              key={entry.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                isActive
                  ? "bg-amber-500 text-slate-900 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110"
                  : isScored
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:border-slate-400"
              }`}
            >
              {entry.bagNumber}
            </button>
          );
        })}
      </div>

      {/* Active bottle scoring card */}
      {activeEntry && activeNotes && (
        <Card className="border-amber-500/30 bg-slate-800/80">
          <CardContent className="pt-6 space-y-5">
            {/* Bottle header */}
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">#{activeEntry.bagNumber}</p>
              <p className="text-xs text-slate-500 mt-1">
                Bottle {activeIndex + 1} of {scorableEntries.length}
              </p>
            </div>

            {/* Score buttons: 1-10 */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center">Score</p>
              <div className="grid grid-cols-5 gap-2">
                {SCORES.map((score) => (
                  <button
                    key={score}
                    onClick={() => updateField("rating", activeNotes.rating === score ? 0 : score)}
                    className={`h-11 rounded-lg text-sm font-bold transition-all ${
                      activeNotes.rating === score
                        ? "bg-amber-500 text-slate-900 scale-105 shadow-lg shadow-amber-500/30"
                        : "bg-slate-700/60 text-slate-300 hover:bg-slate-600 border border-slate-600"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {activeNotes.rating > 0 && (
                <p className="text-center text-xs text-amber-400/80">
                  {activeNotes.rating}/10
                </p>
              )}
            </div>

            {/* Wine type chips */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center">Type (optional)</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {WINE_TYPES.map((wt) => (
                  <button
                    key={wt.value}
                    onClick={() => updateField("wineType", activeNotes.wineType === wt.value ? "" : wt.value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      activeNotes.wineType === wt.value
                        ? "bg-purple-500/40 text-purple-200 border border-purple-400/60"
                        : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {wt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grape guess */}
            <div className="space-y-1 relative">
              <p className="text-xs text-slate-400 flex items-center gap-1 justify-center">
                <Grape className="h-3 w-3" />
                Grape Guess (optional)
              </p>
              <Input
                placeholder="e.g., Cabernet Sauvignon"
                value={activeNotes.grapeGuess}
                onChange={(e) => updateField("grapeGuess", e.target.value)}
                onFocus={() => setGrapeDropdownOpen(true)}
                onBlur={() => setTimeout(() => setGrapeDropdownOpen(false), 200)}
                className="text-sm text-center"
              />
              {grapeDropdownOpen && filteredVarietals.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-lg">
                  {filteredVarietals.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-700"
                      onMouseDown={() => {
                        updateField("grapeGuess", v);
                        setGrapeDropdownOpen(false);
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price range chips */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center">Price Guess (optional)</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.value}
                    onClick={() => updateField("priceRangeGuess", activeNotes.priceRangeGuess === pr.value ? "" : pr.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      activeNotes.priceRangeGuess === pr.value
                        ? "bg-green-500/30 text-green-300 border border-green-400/50"
                        : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <p className="text-xs text-slate-400 text-center">Notes (optional)</p>
              <textarea
                placeholder="Aromas, flavors, finish..."
                value={activeNotes.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>

            {/* Prev/Next navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span className="text-xs text-slate-500">
                {activeIndex + 1} / {scorableEntries.length}
              </span>

              {activeIndex < scorableEntries.length - 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goNext}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="amber"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!allScored}
                  isLoading={submitScore.isPending}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Finish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
