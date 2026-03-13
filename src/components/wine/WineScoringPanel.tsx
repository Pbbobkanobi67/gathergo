"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Grape } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    try {
      await submitScore.mutateAsync({ tripId, eventId, tasteNotes });
      onComplete?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit scores");
    }
  };

  const filteredVarietals = activeNotes?.grapeGuess
    ? WINE_VARIETALS.filter((v) => v.toLowerCase().includes(activeNotes.grapeGuess.toLowerCase())).slice(0, 5)
    : [];

  if (scorableEntries.length === 0) {
    return (
      <div className="wine-card text-center text-sm text-[#A08060] py-6">
        No bags assigned yet. The host needs to assign bag numbers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#C4A882]">
          Scoring: {scoredCount}/{scorableEntries.length} bottles
        </span>
        {allScored && (
          <button
            onClick={handleSubmit}
            disabled={submitScore.isPending}
            className="wine-btn wine-btn-sm !w-auto text-sm"
          >
            <Check className="h-4 w-4" />
            {existingNotes ? "Update Scores" : "Submit All Scores"}
          </button>
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
                  ? "bg-[#C9A040] text-[#1a0508] ring-2 ring-[#C9A040] ring-offset-2 ring-offset-[#160407] scale-110"
                  : isScored
                  ? "bg-[#C9A040]/20 text-[#C9A040] border border-[#C9A040]/50"
                  : "bg-[#2A0A0E] text-[#A08060] border border-[#A08060]/30 hover:border-[#C9A040]/50"
              }`}
            >
              {entry.bagNumber}
            </button>
          );
        })}
      </div>

      {/* Active bottle scoring card */}
      {activeEntry && activeNotes && (
        <div className="wine-card-gold p-5 space-y-5">
          {/* Bottle header */}
          <div className="text-center">
            <p className="font-wine text-4xl font-bold text-[#C9A040]">Bottle #{activeEntry.bagNumber}</p>
            <p className="text-xs text-[#A08060] mt-1">
              {activeIndex + 1} of {scorableEntries.length}
            </p>
          </div>

          {/* Score buttons: two rows of 5 */}
          <div className="space-y-2">
            <p className="text-xs text-[#A08060] text-center uppercase tracking-wider">Score</p>
            <div className="grid grid-cols-5 gap-2">
              {SCORES.map((score) => (
                <button
                  key={score}
                  onClick={() => updateField("rating", activeNotes.rating === score ? 0 : score)}
                  className={`h-12 rounded-lg text-sm font-bold transition-all ${
                    activeNotes.rating === score
                      ? "bg-[#C9A040] text-[#1a0508] scale-105 shadow-lg shadow-[#C9A040]/30"
                      : "bg-[#160407] text-[#C4A882] hover:bg-[#C9A040]/10 border border-[#C9A040]/20"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            {activeNotes.rating > 0 && (
              <p className="text-center text-sm font-wine font-bold text-[#C9A040]">
                {activeNotes.rating}/10
              </p>
            )}
          </div>

          {/* Wine type chips */}
          <div className="space-y-2">
            <p className="text-xs text-[#A08060] text-center uppercase tracking-wider">Type (optional)</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {WINE_TYPES.map((wt) => (
                <button
                  key={wt.value}
                  onClick={() => updateField("wineType", activeNotes.wineType === wt.value ? "" : wt.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    activeNotes.wineType === wt.value
                      ? "bg-[#C9A040]/20 text-[#C9A040] border border-[#C9A040]/50"
                      : "bg-[#160407] text-[#A08060] border border-[#A08060]/30 hover:border-[#C9A040]/40"
                  }`}
                >
                  {wt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grape guess */}
          <div className="space-y-1 relative">
            <p className="text-xs text-[#A08060] flex items-center gap-1 justify-center uppercase tracking-wider">
              <Grape className="h-3 w-3" />
              Grape Guess (optional)
            </p>
            <Input
              placeholder="e.g., Cabernet Sauvignon"
              value={activeNotes.grapeGuess}
              onChange={(e) => updateField("grapeGuess", e.target.value)}
              onFocus={() => setGrapeDropdownOpen(true)}
              onBlur={() => setTimeout(() => setGrapeDropdownOpen(false), 200)}
              className="text-sm text-center bg-[#160407] border-[#C9A040]/20 text-[#F0E3C7] placeholder:text-[#A08060]/50"
            />
            {grapeDropdownOpen && filteredVarietals.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#C9A040]/30 bg-[#2A0A0E] shadow-lg">
                {filteredVarietals.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm text-[#C4A882] hover:bg-[#C9A040]/10"
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
            <p className="text-xs text-[#A08060] text-center uppercase tracking-wider">Price Guess (optional)</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {PRICE_RANGES.map((pr) => (
                <button
                  key={pr.value}
                  onClick={() => updateField("priceRangeGuess", activeNotes.priceRangeGuess === pr.value ? "" : pr.value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                    activeNotes.priceRangeGuess === pr.value
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-[#160407] text-[#A08060] border border-[#A08060]/30 hover:border-[#C9A040]/40"
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <p className="text-xs text-[#A08060] text-center uppercase tracking-wider">Notes (optional)</p>
            <textarea
              placeholder="Aromas, flavors, finish..."
              value={activeNotes.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#C9A040]/20 bg-[#160407] px-3 py-2 text-sm text-[#F0E3C7] placeholder:text-[#A08060]/50 focus:border-[#C9A040]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A040]/30"
            />
          </div>

          {/* Error display */}
          {submitError && (
            <p className="text-center text-xs text-red-400 bg-red-400/10 rounded-lg p-2">
              {submitError}
            </p>
          )}

          {/* Prev/Next navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="wine-btn-ghost wine-btn-sm !w-auto disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <span className="text-xs text-[#A08060]">
              {activeIndex + 1} / {scorableEntries.length}
            </span>

            {activeIndex < scorableEntries.length - 1 ? (
              <button onClick={goNext} className="wine-btn-ghost wine-btn-sm !w-auto">
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allScored || submitScore.isPending}
                className="wine-btn wine-btn-sm !w-auto"
              >
                <Check className="h-4 w-4" />
                Finish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
