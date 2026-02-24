"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Wine,
  Trophy,
  DollarSign,
  Users,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWineEvents, useCreateWineEvent, useUpdateWineEvent } from "@/hooks/useWineEvents";
import { formatDate } from "@/lib/utils";
import { WINE_EVENT_STATUSES, HOOD_BUCKS } from "@/constants";

export default function WinePage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: events, isLoading } = useWineEvents(tripId);
  const createEvent = useCreateWineEvent();
  const updateEvent = useUpdateWineEvent();

  const [addOpen, setAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    priceRangeMin: "4",
    priceRangeMax: "40",
    hoodBucksPotSize: "500",
    allowCashBets: true,
  });

  if (isLoading) {
    return <LoadingPage message="Loading wine events..." />;
  }

  const handleCreate = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    try {
      await createEvent.mutateAsync({
        tripId,
        title: newEvent.title,
        date: newEvent.date,
        priceRangeMin: parseFloat(newEvent.priceRangeMin) || 4,
        priceRangeMax: parseFloat(newEvent.priceRangeMax) || 40,
        hoodBucksPotSize: parseInt(newEvent.hoodBucksPotSize) || 500,
        allowCashBets: newEvent.allowCashBets,
      });
      setNewEvent({ title: "", date: "", priceRangeMin: "4", priceRangeMax: "40", hoodBucksPotSize: "500", allowCashBets: true });
      setAddOpen(false);
    } catch {
      // Error on createEvent.error
    }
  };

  const handleStatusAdvance = async (eventId: string, currentStatus: string) => {
    const statusOrder = ["SETUP", "OPEN", "SCORING", "REVEAL", "COMPLETE"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      await updateEvent.mutateAsync({
        tripId,
        eventId,
        data: { status: statusOrder[currentIndex + 1] },
      });
    }
  };

  const getStatusInfo = (status: string) =>
    WINE_EVENT_STATUSES.find((s) => s.value === status) || WINE_EVENT_STATUSES[0];

  const getNextStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      SETUP: "Open for Entries",
      OPEN: "Start Scoring",
      SCORING: "Reveal Wines",
      REVEAL: "Complete Event",
    };
    return map[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Wine Tasting</h1>
            <p className="text-sm text-slate-400">
              {events?.length || 0} event{events?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Wine Event
        </Button>
      </div>

      {/* Events */}
      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => {
            const statusInfo = getStatusInfo(event.status);
            const nextLabel = getNextStatusLabel(event.status);
            const isActive = event.status !== "COMPLETE";

            return (
              <Link key={event.id} href={`/trips/${tripId}/wine/${event.id}`}>
              <Card className={`transition-colors hover:border-purple-500/50 ${isActive ? "border-purple-500/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                        <Wine className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <p className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
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
                    <p className="text-sm text-slate-300">
                      {event.status === "SETUP" && "Configure the event and set rules. Advance when ready for entries."}
                      {event.status === "OPEN" && "Guests can submit their wine entries. Advance when all entries are in."}
                      {event.status === "SCORING" && "Time for blind tasting! Guests rate each bag number without knowing the wine."}
                      {event.status === "REVEAL" && "The big reveal! See which wines scored best. Advance to finalize results."}
                      {event.status === "COMPLETE" && "Event complete! Results and Hood Bucks have been distributed."}
                    </p>
                  </div>

                  {/* Advance Button */}
                  {nextLabel && (
                    <Button
                      onClick={() => handleStatusAdvance(event.id, event.status)}
                      isLoading={updateEvent.isPending}
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
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wine}
          title="No wine events"
          description="Create a blind wine tasting event. Guests bring wine, taste blind, and vote for their favorites!"
          actionLabel="Create Wine Event"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Add Wine Event Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-purple-400" />
              New Wine Event
            </DialogTitle>
            <DialogDescription>
              Set up a blind wine tasting competition.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wine-title" required>Event Name</Label>
              <Input
                id="wine-title"
                placeholder="e.g., Friday Night Wine Off"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wine-date" required>Date</Label>
              <Input
                id="wine-date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wine-min">Min Price ($)</Label>
                <Input
                  id="wine-min"
                  type="number"
                  value={newEvent.priceRangeMin}
                  onChange={(e) => setNewEvent({ ...newEvent, priceRangeMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wine-max">Max Price ($)</Label>
                <Input
                  id="wine-max"
                  type="number"
                  value={newEvent.priceRangeMax}
                  onChange={(e) => setNewEvent({ ...newEvent, priceRangeMax: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wine-pot">Hood Bucks Prize Pool</Label>
              <Input
                id="wine-pot"
                type="number"
                value={newEvent.hoodBucksPotSize}
                onChange={(e) => setNewEvent({ ...newEvent, hoodBucksPotSize: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newEvent.allowCashBets}
                onChange={(e) => setNewEvent({ ...newEvent, allowCashBets: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-200">Allow cash side bets</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createEvent.isPending}
              disabled={!newEvent.title.trim() || !newEvent.date}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
