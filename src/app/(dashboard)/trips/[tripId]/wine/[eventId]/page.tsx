"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trophy,
  Star,
  DollarSign,
  EyeOff,
  Pencil,
  Eye,
  ArrowRight,
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
import { useWineEvent, useUpdateWineEvent } from "@/hooks/useWineEvents";
import { usePlaceWineBet, useDeleteWineEntry, useRevealWinners } from "@/hooks/useWineEventDetail";
import { useMembers } from "@/hooks/useMembers";
import { useSafeUser } from "@/components/shared/SafeClerkUser";
import { HOOD_BUCKS, WINE_EVENT_STATUSES, CONTEST_TYPES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { WineEventFormModal } from "@/components/wine/WineEventFormModal";
import { WineEntryFormModal } from "@/components/wine/WineEntryFormModal";
import { WineScoringModal } from "@/components/wine/WineScoringModal";
import { WineEntryCard } from "@/components/wine/WineEntryCard";
import { WineBetCard } from "@/components/wine/WineBetCard";
import { ContestStepper } from "@/components/wine/ContestStepper";
import { HowToPlay } from "@/components/wine/HowToPlay";
import { BagAssignmentPanel } from "@/components/wine/BagAssignmentPanel";
import { WinnerConfettiModal } from "@/components/wine/WinnerConfettiModal";
import type { WineEntryWithSubmitter } from "@/types";

export default function WineEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const eventId = params.eventId as string;
  const { data: event, isLoading } = useWineEvent(tripId, eventId);
  const { data: membersData } = useMembers(tripId);
  const { user: clerkUser } = useSafeUser();
  const placeBet = usePlaceWineBet();
  const deleteEntry = useDeleteWineEntry();
  const updateEvent = useUpdateWineEvent();
  const revealWinners = useRevealWinners();

  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [scoringOpen, setScoringOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WineEntryWithSubmitter | null>(null);
  const [confettiOpen, setConfettiOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revealResults, setRevealResults] = useState<any>(null);

  const [betOpen, setBetOpen] = useState(false);
  const [newBet, setNewBet] = useState({
    predictedFirst: "",
    predictedSecond: "",
    predictedThird: "",
    betAmountHoodBucks: "50",
    betAmountCash: "0",
  });

  // Find current user's member ID
  const currentMemberId = useMemo(() => {
    if (!clerkUser || !membersData) return null;
    const found = membersData.find((m: { userId: string | null }) => m.userId === clerkUser.id);
    return found?.id || null;
  }, [clerkUser, membersData]);

  // Check if user is organizer
  const isOrganizer = useMemo(() => {
    if (!membersData || !currentMemberId) return false;
    const member = membersData.find((m: { id: string }) => m.id === currentMemberId);
    return member?.role === "ORGANIZER" || member?.role === "CO_ORGANIZER";
  }, [membersData, currentMemberId]);

  if (isLoading) {
    return <LoadingPage message="Loading tasting event..." />;
  }

  if (!event) return null;

  const statusInfo = WINE_EVENT_STATUSES.find((s) => s.value === event.status) || WINE_EVENT_STATUSES[0];
  const typeInfo = CONTEST_TYPES.find((t) => t.value === event.contestType) || CONTEST_TYPES[0];
  const entries = event.entries || [];
  const scores = event.scores || [];
  const bets = event.bets || [];
  const isRevealed = event.status === "REVEAL" || event.status === "COMPLETE";
  const showDetails = isRevealed || event.status === "SETUP" || event.status === "OPEN";

  // My entries (visible to me during OPEN)
  const myEntries = entries.filter((e) => e.submittedByMemberId === currentMemberId);
  const entriesRemaining = event.entriesPerPerson - myEntries.length;

  // Entries with bag numbers (for scoring view)
  const assignedEntries = entries.filter((e) => e.bagNumber !== null);
  const unassignedEntries = entries.filter((e) => e.bagNumber === null);
  const needsBagAssignment = event.status === "SCORING" && unassignedEntries.length > 0 && isOrganizer;

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
    if (!open && !event) {
      router.push(`/trips/${tripId}/wine`);
    }
  };

  const handleStatusAdvance = async (nextStatus: string) => {
    if (nextStatus === "REVEAL") {
      // Use reveal endpoint for proper scoring
      try {
        const results = await revealWinners.mutateAsync({ tripId, eventId });
        setRevealResults(results);
        setConfettiOpen(true);
      } catch {
        // Error handled by mutation
      }
    } else {
      await updateEvent.mutateAsync({
        tripId,
        eventId,
        data: { status: nextStatus },
      });
    }
  };

  const STATUS_ORDER = ["SETUP", "OPEN", "SCORING", "REVEAL", "COMPLETE"];
  const currentStatusIndex = STATUS_ORDER.indexOf(event.status);
  const nextStatus = currentStatusIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentStatusIndex + 1] : null;

  const NEXT_STATUS_LABELS: Record<string, string> = {
    OPEN: "Open for Entries",
    SCORING: "Start Scoring",
    REVEAL: "Reveal Winners",
    COMPLETE: "Complete Event",
  };

  // Entry options for bet dialog (only entries with bag numbers)
  const entryOptions = assignedEntries.map((e) => ({
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
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeInfo.emoji}</span>
              <h1 className="text-2xl font-bold text-slate-100">{event.title}</h1>
            </div>
            <p className="text-sm text-slate-400">
              {formatDate(event.date)} &middot; {statusInfo.label}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrganizer && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEventFormOpen(true)}
              className="text-slate-400 hover:text-slate-200"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {event.status === "OPEN" && entriesRemaining > 0 && (
            <Button onClick={() => setEntryFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          )}
          {event.status === "SCORING" && assignedEntries.length > 0 && (
            <>
              <Button onClick={() => setScoringOpen(true)} className="gap-2">
                <Star className="h-4 w-4" />
                Score
              </Button>
              <Button onClick={() => setBetOpen(true)} variant="amber" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Place Bet
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contest Stepper */}
      <ContestStepper currentStatus={event.status} />

      {/* How To Play */}
      <HowToPlay
        contestType={event.contestType}
        customInstructions={event.instructions}
        status={event.status}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{event._count?.entries || 0}</p>
          <p className="text-xs text-slate-400">Entries</p>
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

      {/* SETUP phase: Event config summary */}
      {event.status === "SETUP" && (
        <Card className="border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-slate-300">
              <p><strong>Type:</strong> {typeInfo.emoji} {typeInfo.label}</p>
              <p><strong>Entries per person:</strong> {event.entriesPerPerson}</p>
              <p><strong>Price range:</strong> ${event.priceRangeMin} - ${event.priceRangeMax}</p>
              <p><strong>Cash bets:</strong> {event.allowCashBets ? "Allowed" : "Not allowed"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bag Assignment Panel (admin, SCORING phase, unassigned entries) */}
      {needsBagAssignment && (
        <BagAssignmentPanel
          entries={entries}
          tripId={tripId}
          eventId={eventId}
          onComplete={() => {}}
        />
      )}

      {/* My Entries Section (OPEN phase) */}
      {event.status === "OPEN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                {typeInfo.emoji} My Entries
                <Badge variant="secondary" className="text-xs">
                  {myEntries.length}/{event.entriesPerPerson}
                </Badge>
              </span>
              {entriesRemaining > 0 && (
                <Button size="sm" onClick={() => setEntryFormOpen(true)} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myEntries.length > 0 ? (
              <div className="space-y-3">
                {myEntries.map((entry) => (
                  <WineEntryCard
                    key={entry.id}
                    entry={entry}
                    isBlind={false}
                    showDetails={true}
                    canEdit={true}
                    isMyEntry={true}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">
                You haven&apos;t submitted any entries yet. Add up to {event.entriesPerPerson}!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Entries (SCORING: only assigned bags, blind. REVEAL/COMPLETE: all, unmasked) */}
      {(event.status === "SCORING" || isRevealed) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {typeInfo.emoji} {isRevealed ? "All Entries" : "Bags"}
              {event.status === "SCORING" && (
                <Badge variant="warning" className="ml-2 gap-1">
                  <EyeOff className="h-3 w-3" />
                  Blind
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isRevealed ? entries : assignedEntries).length > 0 ? (
              <div className="space-y-3">
                {(isRevealed ? entries : assignedEntries)
                  .sort((a, b) => {
                    // Sort by place first (1st, 2nd, 3rd), then by bag number
                    if (a.finalPlace && b.finalPlace) return a.finalPlace - b.finalPlace;
                    if (a.finalPlace) return -1;
                    if (b.finalPlace) return 1;
                    return (a.bagNumber || 0) - (b.bagNumber || 0);
                  })
                  .map((entry) => (
                    <WineEntryCard
                      key={entry.id}
                      entry={entry}
                      isBlind={event.status === "SCORING"}
                      showDetails={isRevealed}
                      canEdit={false}
                      isMyEntry={entry.submittedByMemberId === currentMemberId}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">
                {event.status === "SCORING"
                  ? "No bags assigned yet. The host needs to assign bag numbers."
                  : "No entries yet."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* SETUP entries (admin sees all submitted entries) */}
      {event.status === "SETUP" && entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {typeInfo.emoji} Entries ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => (
                <WineEntryCard
                  key={entry.id}
                  entry={entry}
                  isBlind={false}
                  showDetails={true}
                  canEdit={isOrganizer}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Scores (REVEAL/COMPLETE) */}
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

      {/* Phase Transition Button (admin only) */}
      {isOrganizer && nextStatus && (
        <Button
          onClick={() => handleStatusAdvance(nextStatus)}
          isLoading={updateEvent.isPending || revealWinners.isPending}
          className="w-full gap-2"
          variant={nextStatus === "REVEAL" ? "amber" : "default"}
          disabled={
            (nextStatus === "SCORING" && entries.length < 2) ||
            (nextStatus === "REVEAL" && assignedEntries.length < 2)
          }
        >
          {nextStatus === "REVEAL" ? (
            <Trophy className="h-4 w-4" />
          ) : nextStatus === "COMPLETE" ? (
            <Eye className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {NEXT_STATUS_LABELS[nextStatus]}
          {nextStatus === "SCORING" && entries.length < 2 && (
            <span className="text-xs opacity-75">(need 2+ entries)</span>
          )}
        </Button>
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
        contestType={event.contestType}
        entriesRemaining={entriesRemaining}
      />

      {/* Scoring Modal */}
      <WineScoringModal
        open={scoringOpen}
        onOpenChange={setScoringOpen}
        tripId={tripId}
        eventId={eventId}
        entries={entries}
      />

      {/* Winner Confetti Modal */}
      <WinnerConfettiModal
        open={confettiOpen}
        onOpenChange={setConfettiOpen}
        results={revealResults}
        contestType={event.contestType}
      />

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
