"use client";

import { useState } from "react";
import { Hash, Save, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { useAssignBags } from "@/hooks/useWineEventDetail";
import type { WineEntryWithSubmitter } from "@/types";

interface BagAssignmentPanelProps {
  entries: WineEntryWithSubmitter[];
  tripId: string;
  eventId: string;
  onComplete: () => void;
}

export function BagAssignmentPanel({ entries, tripId, eventId, onComplete }: BagAssignmentPanelProps) {
  const assignBags = useAssignBags();
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    entries.forEach((e) => {
      initial[e.id] = e.bagNumber ? String(e.bagNumber) : "";
    });
    return initial;
  });

  const handleAutoNumber = () => {
    // Shuffle entries then assign sequential numbers
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const newAssignments: Record<string, string> = {};
    shuffled.forEach((e, i) => {
      newAssignments[e.id] = String(i + 1);
    });
    setAssignments(newAssignments);
  };

  const handleSave = async () => {
    const parsed = Object.entries(assignments)
      .filter(([, val]) => val && !isNaN(parseInt(val)))
      .map(([entryId, val]) => ({
        entryId,
        bagNumber: parseInt(val),
      }));

    if (parsed.length === 0) return;

    try {
      await assignBags.mutateAsync({ tripId, eventId, assignments: parsed });
      onComplete();
    } catch {
      // Error handled by mutation
    }
  };

  const allAssigned = entries.every((e) => {
    const val = assignments[e.id];
    return val && !isNaN(parseInt(val)) && parseInt(val) > 0;
  });

  // Check for duplicate bag numbers
  const bagValues = Object.values(assignments).filter((v) => v && !isNaN(parseInt(v)));
  const hasDuplicates = new Set(bagValues).size !== bagValues.length;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Hash className="h-5 w-5 text-amber-400" />
          Assign Bag Numbers
        </CardTitle>
        <p className="text-sm text-slate-400">
          Map each entry to its physical bag number. Only you can see the entry details.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => {
            const submitterName = entry.submittedBy?.user?.name || entry.submittedBy?.guestName || "Unknown";
            return (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <Input
                  type="number"
                  min={1}
                  placeholder="#"
                  value={assignments[entry.id] || ""}
                  onChange={(e) => setAssignments((a) => ({ ...a, [entry.id]: e.target.value }))}
                  className="w-16 text-center font-bold"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{entry.wineName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {entry.winery && `${entry.winery} · `}
                    {entry.varietal && `${entry.varietal} · `}
                    ${entry.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    name={submitterName}
                    src={entry.submittedBy?.user?.avatarUrl}
                    size="sm"
                  />
                  <span className="text-xs text-slate-400 hidden sm:inline">{submitterName}</span>
                </div>
              </div>
            );
          })}
        </div>

        {hasDuplicates && (
          <p className="mt-2 text-xs text-red-400">Duplicate bag numbers detected</p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoNumber} className="gap-1">
            <Shuffle className="h-3 w-3" />
            Auto-Number
          </Button>
          <Button
            onClick={handleSave}
            isLoading={assignBags.isPending}
            disabled={!allAssigned || hasDuplicates}
            className="flex-1 gap-1"
          >
            <Save className="h-4 w-4" />
            Save Assignments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
