"use client";

import Link from "next/link";
import {
  Wine,
  Calendar,
  DollarSign,
  Trophy,
  Eye,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { WINE_EVENT_STATUSES, HOOD_BUCKS } from "@/constants";
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
  OPEN: "Guests can submit their wine entries. Advance when all entries are in.",
  SCORING: "Time for blind tasting! Guests rate each bag number without knowing the wine.",
  REVEAL: "The big reveal! See which wines scored best. Advance to finalize results.",
  COMPLETE: "Event complete! Results and Hood Bucks have been distributed.",
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  SETUP: "Open for Entries",
  OPEN: "Start Scoring",
  SCORING: "Reveal Wines",
  REVEAL: "Complete Event",
};

export function WineEventCard({ event, tripId, onEdit, onStatusAdvance, isAdvancing }: WineEventCardProps) {
  const statusInfo = WINE_EVENT_STATUSES.find((s) => s.value === event.status) || WINE_EVENT_STATUSES[0];
  const nextLabel = NEXT_STATUS_LABELS[event.status];
  const isActive = event.status !== "COMPLETE";

  return (
    <Card className={`transition-colors hover:border-purple-500/50 ${isActive ? "border-purple-500/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/trips/${tripId}/wine/${event.id}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
              <Wine className="h-6 w-6 text-purple-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <p className="flex items-center gap-1 text-sm text-slate-400">
                <Calendar className="h-3 w-3" />
                {formatDate(event.date)}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onEdit(event);
              }}
              className="h-8 w-8 text-slate-400 hover:text-slate-200"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Badge
              variant={
                event.status === "COMPLETE"
                  ? "success"
                  : event.status === "SCORING"
                  ? "warning"
                  : event.status === "REVEAL"
                  ? "purple"
                  : "secondary"
              }
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-900/50 p-3 text-center">
            <p className="text-lg font-bold text-slate-100">{event._count?.entries || 0}</p>
            <p className="text-xs text-slate-400">Wines</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 p-3 text-center">
            <p className="text-lg font-bold text-slate-100">{event._count?.scores || 0}</p>
            <p className="text-xs text-slate-400">Scored</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 p-3 text-center">
            <p className="text-lg font-bold text-slate-100">{event._count?.bets || 0}</p>
            <p className="text-xs text-slate-400">Bets</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 p-3 text-center">
            <p className="text-lg font-bold text-amber-400">
              {event.hoodBucksPotSize} {HOOD_BUCKS.CURRENCY_SYMBOL}
            </p>
            <p className="text-xs text-slate-400">Prize Pool</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${event.priceRangeMin} - ${event.priceRangeMax} range
          </span>
          {event.allowCashBets && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-400" />
              Cash bets allowed
            </span>
          )}
        </div>

        {/* Status Description */}
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-sm text-slate-300">{STATUS_DESCRIPTIONS[event.status]}</p>
        </div>

        {/* Advance Button */}
        {nextLabel && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              onStatusAdvance(event.id, event.status);
            }}
            isLoading={isAdvancing}
            className="mt-4 w-full gap-2"
            variant={event.status === "SCORING" ? "amber" : "default"}
          >
            {event.status === "REVEAL" ? (
              <Eye className="h-4 w-4" />
            ) : event.status === "SCORING" ? (
              <Trophy className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4 rotate-180" />
            )}
            {nextLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
