"use client";

import { Hash, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import type { WineEntryWithSubmitter } from "@/types";

interface WineEntryCardProps {
  entry: WineEntryWithSubmitter;
  isBlind: boolean;
  showDetails: boolean;
  canEdit: boolean;
  isMyEntry?: boolean;
  onEdit: (entry: WineEntryWithSubmitter) => void;
  onDelete: (entry: WineEntryWithSubmitter) => void;
}

export function WineEntryCard({ entry, isBlind, showDetails, canEdit, isMyEntry, onEdit, onDelete }: WineEntryCardProps) {
  const submitterName = entry.submittedBy?.user?.name || entry.submittedBy?.guestName || null;
  const hasBagNumber = entry.bagNumber !== null && entry.bagNumber !== undefined;

  return (
    <div
      className={`rounded-xl border p-4 ${
        entry.finalPlace === 1
          ? "border-amber-500/30 bg-amber-500/5"
          : entry.finalPlace === 2
          ? "border-slate-400/30 bg-slate-400/5"
          : entry.finalPlace === 3
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-slate-700 bg-slate-800/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-lg font-bold text-purple-400">
          {hasBagNumber ? (
            <>
              <Hash className="mr-0.5 h-4 w-4" />
              {entry.bagNumber}
            </>
          ) : (
            <span className="text-xs text-slate-500">--</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100">
              {showDetails ? entry.wineName : hasBagNumber ? `Bag #${entry.bagNumber}` : "Pending"}
            </h3>
            {entry.finalPlace && (
              <Badge variant={entry.finalPlace === 1 ? "warning" : "secondary"}>
                {entry.finalPlace === 1 ? "\u{1F947} 1st" : entry.finalPlace === 2 ? "\u{1F948} 2nd" : "\u{1F949} 3rd"}
              </Badge>
            )}
            {isMyEntry && (
              <Badge variant="outline" className="text-[10px]">
                <User className="mr-1 h-3 w-3" />
                Mine
              </Badge>
            )}
            {!hasBagNumber && !showDetails && (
              <Badge variant="secondary" className="text-[10px]">Pending</Badge>
            )}
          </div>
          {showDetails && (
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
              {entry.winery && <span>{entry.winery}</span>}
              {entry.vintage && <span>{entry.vintage}</span>}
              {entry.varietal && <span>{entry.varietal}</span>}
              {entry.price > 0 && <span className="text-green-400">${entry.price.toFixed(2)}</span>}
            </div>
          )}
          {entry.notes && showDetails && (
            <p className="mt-1 text-xs text-slate-500">{entry.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
                className="h-8 w-8 text-slate-400 hover:text-slate-200"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry)}
                className="h-8 w-8 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {submitterName && showDetails && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2 py-1">
              <UserAvatar
                name={submitterName}
                src={entry.submittedBy?.user?.avatarUrl}
                size="sm"
              />
              <span className="text-xs text-slate-300">{submitterName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
