"use client";

import Link from "next/link";
import {
  DollarSign,
  Trophy,
  Eye,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { WINE_EVENT_STATUSES, HOOD_BUCKS, CONTEST_TYPES } from "@/constants";
import type { WineEventWithDetails } from "@/types";

interface WineEventCardProps {
  event: WineEventWithDetails;
  tripId: string;
  onEdit: (event: WineEventWithDetails) => void;
  onStatusAdvance: (eventId: string, currentStatus: string) => void;
  isAdvancing?: boolean;
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  SETUP: "Configure the event and set rules. Advance when ready for entries.",
  OPEN: "Participants can submit their entries privately.",
  SCORING: "Time for blind tasting! Rate each bag without knowing what's inside.",
  REVEAL: "The big reveal! See which entries scored best.",
  COMPLETE: "Event complete! Results and Hood Bucks have been distributed.",
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  SETUP: "Open for Entries",
  OPEN: "Start Scoring",
  SCORING: "Reveal Winners",
  REVEAL: "Complete Event",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  SETUP: "bg-[#C9A040]/20 text-[#C9A040] border border-[#C9A040]/30",
  OPEN: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  SCORING: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  REVEAL: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  COMPLETE: "bg-[#C9A040]/20 text-[#C9A040] border border-[#C9A040]/30",
};

export function WineEventCard({ event, tripId, onEdit, onStatusAdvance, isAdvancing }: WineEventCardProps) {
  const statusInfo = WINE_EVENT_STATUSES.find((s) => s.value === event.status) || WINE_EVENT_STATUSES[0];
  const nextLabel = NEXT_STATUS_LABELS[event.status];
  const typeInfo = CONTEST_TYPES.find((t) => t.value === event.contestType) || CONTEST_TYPES[0];
  const badgeClass = STATUS_BADGE_CLASSES[event.status] || STATUS_BADGE_CLASSES.SETUP;

  return (
    <div className="wine-card space-y-5 transition-all hover:border-[rgba(201,160,64,0.35)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Link href={`/trips/${tripId}/wine/${event.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-3xl">{typeInfo.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-wine text-xl text-[#F0E3C7] font-semibold">{event.title}</h3>
            <p className="text-sm text-[#A08060]">
              {formatDate(event.date)} &middot; {event.entriesPerPerson} per person
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(event); }}
            className="p-1.5 rounded-lg text-[#A08060] hover:text-[#C9A040] transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-[#160407] p-3 text-center">
          <p className="font-wine text-xl font-bold text-[#F0E3C7]">{event._count?.entries || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Entries</p>
        </div>
        <div className="rounded-xl bg-[#160407] p-3 text-center">
          <p className="font-wine text-xl font-bold text-[#F0E3C7]">{event._count?.scores || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Scored</p>
        </div>
        <div className="rounded-xl bg-[#160407] p-3 text-center">
          <p className="font-wine text-xl font-bold text-[#F0E3C7]">{event._count?.bets || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Bets</p>
        </div>
        <div className="rounded-xl bg-[#160407] p-3 text-center">
          <p className="font-wine text-lg font-bold text-[#C9A040]">
            {event.hoodBucksPotSize} {HOOD_BUCKS.CURRENCY_SYMBOL}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Prize</p>
        </div>
      </div>

      {/* Details badges */}
      <div className="flex flex-wrap gap-2 text-xs text-[#A08060]">
        <span className="px-2.5 py-1 rounded-full border border-[#C9A040]/20 bg-[#C9A040]/5">
          {typeInfo.emoji} {typeInfo.label}
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#C9A040]/20 bg-[#C9A040]/5">
          <DollarSign className="h-3 w-3" />
          ${event.priceRangeMin}-${event.priceRangeMax}
        </span>
        {event.allowCashBets && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            <DollarSign className="h-3 w-3" />
            Cash bets
          </span>
        )}
      </div>

      {/* Status Description */}
      <p className="text-sm text-[#C4A882] leading-relaxed">
        {STATUS_DESCRIPTIONS[event.status]}
      </p>

      {/* Action Button */}
      {nextLabel && (
        <button
          onClick={(e) => { e.preventDefault(); onStatusAdvance(event.id, event.status); }}
          disabled={isAdvancing}
          className="wine-btn"
        >
          {event.status === "REVEAL" ? <Eye className="h-4 w-4" /> :
           event.status === "SCORING" ? <Trophy className="h-4 w-4" /> :
           <ArrowRight className="h-4 w-4" />}
          {nextLabel}
        </button>
      )}

      {/* Completed: View Results link */}
      {event.status === "COMPLETE" && (
        <Link href={`/trips/${tripId}/wine/${event.id}`} className="block">
          <button className="wine-btn-ghost w-full">
            <Trophy className="h-4 w-4" />
            View Results
          </button>
        </Link>
      )}
    </div>
  );
}
