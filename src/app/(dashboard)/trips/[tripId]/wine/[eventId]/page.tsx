"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Wine,
  Trophy,
  Star,
  DollarSign,
  EyeOff,
  Hash,
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
import { useSubmitWineEntry, usePlaceWineBet } from "@/hooks/useWineEventDetail";
import { formatDate } from "@/lib/utils";
import { HOOD_BUCKS, WINE_EVENT_STATUSES } from "@/constants";

export default function WineEventDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const eventId = params.eventId as string;
  const { data: event, isLoading } = useWineEvent(tripId, eventId);
  const submitEntry = useSubmitWineEntry();
  const placeBet = usePlaceWineBet();

  const [entryOpen, setEntryOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    wineName: "",
    winery: "",
    vintage: "",
    varietal: "",
    price: "",
    notes: "",
  });
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

  const handleSubmitEntry = async () => {
    if (!newEntry.wineName.trim() || !newEntry.price) return;
    try {
      await submitEntry.mutateAsync({
        tripId,
        eventId,
        wineName: newEntry.wineName,
        winery: newEntry.winery || undefined,
        vintage: newEntry.vintage ? parseInt(newEntry.vintage) : undefined,
        varietal: newEntry.varietal || undefined,
        price: parseFloat(newEntry.price),
        notes: newEntry.notes || undefined,
      });
      setNewEntry({ wineName: "", winery: "", vintage: "", varietal: "", price: "", notes: "" });
      setEntryOpen(false);
    } catch {
      // Error on submitEntry.error
    }
  };

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

  const statusInfo = WINE_EVENT_STATUSES.find((s) => s.value === event.status) || WINE_EVENT_STATUSES[0];
  const entries = event.entries || [];
  const scores = event.scores || [];
  const bets = event.bets || [];
  const isBlind = event.status === "SCORING" || event.status === "OPEN";
  const isRevealed = event.status === "REVEAL" || event.status === "COMPLETE";

  const entryOptions = entries.map((e: { id: string; bagNumber: number; wineName: string }) => ({
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
          {(event.status === "SETUP" || event.status === "OPEN") && (
            <Button onClick={() => setEntryOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Wine
            </Button>
          )}
          {event.status === "SCORING" && entries.length > 0 && (
            <Button onClick={() => setBetOpen(true)} variant="amber" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Place Bet
            </Button>
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
              {entries.map((entry: {
                id: string;
                bagNumber: number;
                wineName: string;
                winery: string | null;
                vintage: number | null;
                varietal: string | null;
                price: number;
                notes: string | null;
                finalPlace: number | null;
                isRevealed: boolean;
                submittedBy: { guestName: string | null; user: { name: string; avatarUrl: string | null } | null } | null;
              }) => {
                const submitterName = entry.submittedBy?.user?.name || entry.submittedBy?.guestName || null;
                const showDetails = isRevealed || event.status === "SETUP";

                return (
                  <div
                    key={entry.id}
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
                        <Hash className="mr-0.5 h-4 w-4" />
                        {entry.bagNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-100">
                            {showDetails ? entry.wineName : `Bag #${entry.bagNumber}`}
                          </h3>
                          {entry.finalPlace && (
                            <Badge variant={entry.finalPlace === 1 ? "warning" : "secondary"}>
                              {entry.finalPlace === 1 ? "🥇 1st" : entry.finalPlace === 2 ? "🥈 2nd" : "🥉 3rd"}
                            </Badge>
                          )}
                        </div>
                        {showDetails && (
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
                            {entry.winery && <span>{entry.winery}</span>}
                            {entry.vintage && <span>{entry.vintage}</span>}
                            {entry.varietal && <span>{entry.varietal}</span>}
                            <span className="text-green-400">${entry.price.toFixed(2)}</span>
                          </div>
                        )}
                        {entry.notes && showDetails && (
                          <p className="mt-1 text-xs text-slate-500">{entry.notes}</p>
                        )}
                      </div>
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
                );
              })}
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
              {bets.map((bet: {
                id: string;
                betAmountHoodBucks: number;
                betAmountCash: number;
                isCorrect: boolean | null;
                hoodBucksWon: number;
                member: { guestName: string | null; user: { name: string; avatarUrl: string | null } | null } | null;
              }) => {
                const betterName = bet.member?.user?.name || bet.member?.guestName || "Guest";
                return (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={betterName} src={bet.member?.user?.avatarUrl} size="md" />
                      <div>
                        <p className="font-medium text-slate-100">{betterName}</p>
                        <p className="text-xs text-slate-400">
                          {bet.betAmountHoodBucks > 0 && `${bet.betAmountHoodBucks} ${HOOD_BUCKS.CURRENCY_SYMBOL}`}
                          {bet.betAmountHoodBucks > 0 && bet.betAmountCash > 0 && " + "}
                          {bet.betAmountCash > 0 && `$${bet.betAmountCash.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                    {bet.isCorrect !== null && (
                      <Badge variant={bet.isCorrect ? "success" : "secondary"}>
                        {bet.isCorrect ? `Won ${bet.hoodBucksWon} ${HOOD_BUCKS.CURRENCY_SYMBOL}` : "Lost"}
                      </Badge>
                    )}
                  </div>
                );
              })}
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

      {/* Add Wine Entry Dialog */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-purple-400" />
              Add Wine Entry
            </DialogTitle>
            <DialogDescription>
              Submit your wine. It will be assigned the next bag number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wine-name" required>Wine Name</Label>
              <Input
                id="wine-name"
                placeholder="e.g., 2019 Caymus Cabernet"
                value={newEntry.wineName}
                onChange={(e) => setNewEntry({ ...newEntry, wineName: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry-winery">Winery</Label>
                <Input
                  id="entry-winery"
                  placeholder="e.g., Caymus Vineyards"
                  value={newEntry.winery}
                  onChange={(e) => setNewEntry({ ...newEntry, winery: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-varietal">Varietal</Label>
                <Input
                  id="entry-varietal"
                  placeholder="e.g., Cabernet Sauvignon"
                  value={newEntry.varietal}
                  onChange={(e) => setNewEntry({ ...newEntry, varietal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry-vintage">Vintage Year</Label>
                <Input
                  id="entry-vintage"
                  type="number"
                  placeholder="e.g., 2019"
                  value={newEntry.vintage}
                  onChange={(e) => setNewEntry({ ...newEntry, vintage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-price" required>Price ($)</Label>
                <Input
                  id="entry-price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 24.99"
                  value={newEntry.price}
                  onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-notes">Notes</Label>
              <Input
                id="entry-notes"
                placeholder="Tasting notes, pairing suggestions..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitEntry}
              isLoading={submitEntry.isPending}
              disabled={!newEntry.wineName.trim() || !newEntry.price}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Submit Wine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Place Bet Dialog */}
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
