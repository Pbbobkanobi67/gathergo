"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Wine,
  Trophy,
  Star,
  DollarSign,
  EyeOff,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWineEvent } from "@/hooks/useWineEvents";
import { usePlaceWineBet } from "@/hooks/useWineEventDetail";
import { HOOD_BUCKS, WINE_EVENT_STATUSES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { WineEventFormModal } from "@/components/wine/WineEventFormModal";
import { WineEntryFormModal } from "@/components/wine/WineEntryFormModal";
import { WineScoringModal } from "@/components/wine/WineScoringModal";
import { WineEntryCard } from "@/components/wine/WineEntryCard";
import { WineBetCard } from "@/components/wine/WineBetCard";
import type { WineEntryWithSubmitter } from "@/types";
import { useDeleteWineEntry } from "@/hooks/useWineEventDetail";

export default function WineEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const eventId = params.eventId as string;
  const { data: event, isLoading } = useWineEvent(tripId, eventId);
  const placeBet = usePlaceWineBet();
  const deleteEntry = useDeleteWineEntry();

  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [scoringOpen, setScoringOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WineEntryWithSubmitter | null>(null);

  const [betOpen, setBetOpen] = useState(false);
  const [newBet, setNewBet] = useState({
    predictedFirst: "",
    predictedSecond: "",
    predictedThird: "",
    betAmountHoodBucks: "50",
    betAmountCash: "0",
  });

  if (isLoading) {
    return <LoadingPage message="Loading wine event..." />;
  }

  if (!event) return null;

  const handlePlaceBet = async () => {
    if (!newBet.predictedFirst || !newBet.predictedSecond || !newBet.predictedThird) return;
    try {
      await placeBet.mutateAsync({
        tripId,
        eventId,
        predictedFirst: newBet.predictedFirst,
        predictedSecond: newBet.predictedSecond,
        predictedThird: newBet.predictedThird,
        betAmountHoodBucks: parseInt(newBet.betAmountHoodBucks) || 0,
        betAmountCash: parseFloat(newBet.betAmountCash) || 0,
      });
      setNewBet({ predictedFirst: "", predictedSecond: "", predictedThird: "", betAmountHoodBucks: "50", betAmountCash: "0" });
      setBetOpen(false);
    } catch {
      // Error on placeBet.error
    }
  };

  const handleDeleteEntry = async (entry: WineEntryWithSubmitter) => {
    try {
      await deleteEntry.mutateAsync({ tripId, eventId, entryId: entry.id });
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditEntry = (entry: WineEntryWithSubmitter) => {
    setEditingEntry(entry);
    setEntryFormOpen(true);
  };

  const handleEntryFormClose = (open: boolean) => {
    setEntryFormOpen(open);
    if (!open) setEditingEntry(null);
  };

  const handleEventFormClose = (open: boolean) => {
    setEventFormOpen(open);
    // If event was deleted, navigate back
    if (!open && !event) {
      router.push(`/trips/${tripId}/wine`);
    }
  };

  const statusInfo = WINE_EVENT_STATUSES.find((s) => s.value === event.status) || WINE_EVENT_STATUSES[0];
  const entries = event.entries || [];
  const scores = event.scores || [];
  const bets = event.bets || [];
  const isBlind = event.status === "SCORING" || event.status === "OPEN";
  const isRevealed = event.status === "REVEAL" || event.status === "COMPLETE";
  const canEditEntries = event.status === "SETUP" || event.status === "OPEN";
  const showDetails = isRevealed || event.status === "SETUP";

  const entryOptions = entries.map((e) => ({
    value: e.id,
    label: isRevealed ? `Bag #${e.bagNumber} - ${e.wineName}` : `Bag #${e.bagNumber}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}/wine`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{event.title}</h1>
            <p className="text-sm text-slate-400">
              {formatDate(event.date)} &middot; {statusInfo.label}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEventFormOpen(true)}
            className="text-slate-400 hover:text-slate-200"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {canEditEntries && (
            <Button onClick={() => setEntryFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Wine
            </Button>
          )}
          {event.status === "SCORING" && entries.length > 0 && (
            <>
              <Button onClick={() => setScoringOpen(true)} className="gap-2">
                <Star className="h-4 w-4" />
                Score Wines
              </Button>
              <Button onClick={() => setBetOpen(true)} variant="amber" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Place Bet
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{entries.length}</p>
          <p className="text-xs text-slate-400">Wines</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-teal-400">{scores.length}</p>
          <p className="text-xs text-slate-400">Scored</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{bets.length}</p>
          <p className="text-xs text-slate-400">Bets</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">
            {event.hoodBucksPotSize} {HOOD_BUCKS.CURRENCY_SYMBOL}
          </p>
          <p className="text-xs text-slate-400">Prize Pool</p>
        </div>
      </div>

      {/* Wine Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wine className="h-5 w-5 text-purple-400" />
            Wine Entries
            {isBlind && (
              <Badge variant="warning" className="ml-2 gap-1">
                <EyeOff className="h-3 w-3" />
                Blind
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <WineEntryCard
                  key={entry.id}
                  entry={entry}
                  isBlind={isBlind}
                  showDetails={showDetails}
                  canEdit={canEditEntries}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">No wine entries yet. Add one to get started!</p>
          )}
        </CardContent>
      </Card>

      {/* Bets */}
      {bets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-400" />
              Bets ({bets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bets.map((bet) => (
                <WineBetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scores */}
      {scores.length > 0 && isRevealed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-400" />
              Scores ({scores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scores.map((score) => {
                const scorerName = score.member?.user?.name || score.member?.guestName || "Guest";
                return (
                  <div
                    key={score.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                  >
                    <UserAvatar name={scorerName} src={score.member?.user?.avatarUrl} size="sm" />
                    <span className="text-sm text-slate-200">{scorerName}</span>
                    {score.submittedAt && (
                      <Badge variant="success" className="ml-auto">Submitted</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Event Modal */}
      <WineEventFormModal
        open={eventFormOpen}
        onOpenChange={handleEventFormClose}
        tripId={tripId}
        event={event}
      />

      {/* Add/Edit Entry Modal */}
      <WineEntryFormModal
        open={entryFormOpen}
        onOpenChange={handleEntryFormClose}
        tripId={tripId}
        eventId={eventId}
        entry={editingEntry}
      />

      {/* Scoring Modal */}
      <WineScoringModal
        open={scoringOpen}
        onOpenChange={setScoringOpen}
        tripId={tripId}
        eventId={eventId}
        entries={entries}
      />

      {/* Place Bet Dialog (kept inline — straightforward) */}
      <Dialog open={betOpen} onOpenChange={setBetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Place Your Bet
            </DialogTitle>
            <DialogDescription>
              Predict which bags will place 1st, 2nd, and 3rd.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bet-first" required>Predicted 1st Place</Label>
              <Select
                id="bet-first"
                placeholder="Select bag..."
                options={entryOptions}
                value={newBet.predictedFirst}
                onChange={(e) => setNewBet({ ...newBet, predictedFirst: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bet-second" required>Predicted 2nd Place</Label>
              <Select
                id="bet-second"
                placeholder="Select bag..."
                options={entryOptions}
                value={newBet.predictedSecond}
                onChange={(e) => setNewBet({ ...newBet, predictedSecond: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bet-third" required>Predicted 3rd Place</Label>
              <Select
                id="bet-third"
                placeholder="Select bag..."
                options={entryOptions}
                value={newBet.predictedThird}
                onChange={(e) => setNewBet({ ...newBet, predictedThird: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bet-hb">Hood Bucks</Label>
                <Input
                  id="bet-hb"
                  type="number"
                  value={newBet.betAmountHoodBucks}
                  onChange={(e) => setNewBet({ ...newBet, betAmountHoodBucks: e.target.value })}
                />
              </div>
              {event.allowCashBets && (
                <div className="space-y-2">
                  <Label htmlFor="bet-cash">Cash ($)</Label>
                  <Input
                    id="bet-cash"
                    type="number"
                    step="0.01"
                    value={newBet.betAmountCash}
                    onChange={(e) => setNewBet({ ...newBet, betAmountCash: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBetOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePlaceBet}
              isLoading={placeBet.isPending}
              disabled={!newBet.predictedFirst || !newBet.predictedSecond || !newBet.predictedThird}
              className="gap-2"
              variant="amber"
            >
              <DollarSign className="h-4 w-4" />
              Place Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
