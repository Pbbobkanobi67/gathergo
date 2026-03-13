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
import { usePlaceWineBet, useDeleteWineEntry, useRevealWinners, useLiveLeaderboard } from "@/hooks/useWineEventDetail";
import { useMembers } from "@/hooks/useMembers";
import { useSafeUser } from "@/components/shared/SafeClerkUser";
import { HOOD_BUCKS, WINE_EVENT_STATUSES, CONTEST_TYPES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { WineEventFormModal } from "@/components/wine/WineEventFormModal";
import { WineEntryFormModal } from "@/components/wine/WineEntryFormModal";
import { WineScoringPanel } from "@/components/wine/WineScoringPanel";
import { VoterProgressPanel } from "@/components/wine/VoterProgressPanel";
import { RevealSequence } from "@/components/wine/RevealSequence";
import { WineEntryCard } from "@/components/wine/WineEntryCard";
import { WineBetCard } from "@/components/wine/WineBetCard";
import { ContestStepper } from "@/components/wine/ContestStepper";
import { HowToPlay } from "@/components/wine/HowToPlay";
import { BagAssignmentPanel } from "@/components/wine/BagAssignmentPanel";
import { LiveLeaderboard } from "@/components/wine/LiveLeaderboard";
import { ScoreBreakdownTable } from "@/components/wine/ScoreBreakdownTable";
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
  const { data: leaderboardData } = useLiveLeaderboard(tripId, eventId, event?.status === "SCORING");

  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WineEntryWithSubmitter | null>(null);
  const [confettiOpen, setConfettiOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revealResults, setRevealResults] = useState<any>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const [betOpen, setBetOpen] = useState(false);
  const [newBet, setNewBet] = useState({
    predictedFirst: "",
    predictedSecond: "",
    predictedThird: "",
    betAmountHoodBucks: "50",
    betAmountCash: "0",
  });

  const currentMemberId = useMemo(() => {
    if (!clerkUser || !membersData) return null;
    const found = membersData.find((m) => m.user?.clerkId === clerkUser.id);
    return found?.id || null;
  }, [clerkUser, membersData]);

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

  const myEntries = entries.filter((e) => e.submittedByMemberId === currentMemberId);
  const entriesRemaining = event.entriesPerPerson - myEntries.length;
  const assignedEntries = entries.filter((e) => e.bagNumber !== null);
  const unassignedEntries = entries.filter((e) => e.bagNumber === null);
  const needsBagAssignment = event.status === "SCORING" && unassignedEntries.length > 0 && isOrganizer;
  const submittedScoreCount = scores.filter((s) => s.submittedAt).length;

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
    } catch {}
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
    setAdvanceError(null);
    try {
      if (nextStatus === "REVEAL") {
        const results = await revealWinners.mutateAsync({ tripId, eventId });
        setRevealResults(results);
        setConfettiOpen(true);
      } else {
        await updateEvent.mutateAsync({
          tripId,
          eventId,
          data: { status: nextStatus },
        });
      }
    } catch (err) {
      console.error("Status advance failed:", err);
      setAdvanceError(err instanceof Error ? err.message : "Failed to advance status");
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

  const entryOptions = assignedEntries.map((e) => ({
    value: e.id,
    label: isRevealed ? `Bag #${e.bagNumber} - ${e.wineName}` : `Bag #${e.bagNumber}`,
  }));

  return (
    <div className="wine-page -mx-4 -mt-6 -mb-20 px-4 pt-6 pb-20 lg:-mx-6 lg:px-6 lg:-mb-6 lg:pb-6 rounded-t-2xl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${tripId}/wine`}>
              <button className="p-2 rounded-lg text-[#A08060] hover:text-[#C9A040] transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeInfo.emoji}</span>
                <h1 className="font-wine text-2xl font-bold text-[#C9A040]">{event.title}</h1>
              </div>
              <p className="text-sm text-[#A08060]">
                {formatDate(event.date)} &middot; {statusInfo.label}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOrganizer && (
              <button
                onClick={() => setEventFormOpen(true)}
                className="p-2 rounded-lg text-[#A08060] hover:text-[#C9A040] transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {event.status === "OPEN" && entriesRemaining > 0 && (
              <button onClick={() => setEntryFormOpen(true)} className="wine-btn wine-btn-sm !w-auto">
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
            )}
            {event.status === "SCORING" && assignedEntries.length > 0 && (
              <button onClick={() => setBetOpen(true)} className="wine-btn-ghost wine-btn-sm !w-auto">
                <DollarSign className="h-4 w-4" />
                Place Bet
              </button>
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
          <div className="wine-card !p-3 text-center">
            <p className="font-wine text-2xl font-bold text-[#F0E3C7]">{event._count?.entries || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Entries</p>
          </div>
          <div className="wine-card !p-3 text-center">
            <p className="font-wine text-2xl font-bold text-[#F0E3C7]">{scores.length}{membersData ? `/${membersData.length}` : ""}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Scored</p>
          </div>
          <div className="wine-card !p-3 text-center">
            <p className="font-wine text-2xl font-bold text-[#F0E3C7]">{bets.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Bets</p>
          </div>
          <div className="wine-card !p-3 text-center">
            <p className="font-wine text-lg font-bold text-[#C9A040]">
              {event.hoodBucksPotSize} {HOOD_BUCKS.CURRENCY_SYMBOL}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[#A08060]">Prize Pool</p>
          </div>
        </div>

        {/* SETUP phase: Event config */}
        {event.status === "SETUP" && (
          <div className="wine-card space-y-2 text-sm text-[#C4A882]">
            <p><strong className="text-[#F0E3C7]">Type:</strong> {typeInfo.emoji} {typeInfo.label}</p>
            <p><strong className="text-[#F0E3C7]">Entries per person:</strong> {event.entriesPerPerson}</p>
            <p><strong className="text-[#F0E3C7]">Price range:</strong> ${event.priceRangeMin} - ${event.priceRangeMax}</p>
            <p><strong className="text-[#F0E3C7]">Cash bets:</strong> {event.allowCashBets ? "Allowed" : "Not allowed"}</p>
          </div>
        )}

        {/* Bag Assignment Panel */}
        {needsBagAssignment && (
          <BagAssignmentPanel
            entries={entries}
            tripId={tripId}
            eventId={eventId}
            onComplete={() => {}}
          />
        )}

        {/* Inline Scoring Panel (SCORING phase) */}
        {event.status === "SCORING" && assignedEntries.length > 0 && (
          <WineScoringPanel
            tripId={tripId}
            eventId={eventId}
            entries={entries}
            existingNotes={leaderboardData?.myTasteNotes}
          />
        )}

        {/* Voter Progress (SCORING phase) */}
        {event.status === "SCORING" && leaderboardData?.voterProgress && (
          <VoterProgressPanel voters={leaderboardData.voterProgress} />
        )}

        {/* Live Leaderboard (SCORING phase) */}
        {event.status === "SCORING" && assignedEntries.length > 0 && (
          <LiveLeaderboard tripId={tripId} eventId={eventId} />
        )}

        {/* My Entries Section (OPEN phase) */}
        {event.status === "OPEN" && (
          <div className="wine-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-wine text-lg text-[#F0E3C7]">
                {typeInfo.emoji} My Entries
                <span className="ml-2 text-sm text-[#A08060]">
                  {myEntries.length}/{event.entriesPerPerson}
                </span>
              </h3>
              {entriesRemaining > 0 && (
                <button onClick={() => setEntryFormOpen(true)} className="wine-btn wine-btn-sm !w-auto text-sm">
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
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
              <p className="text-center text-sm text-[#A08060] py-4">
                You haven&apos;t submitted any entries yet. Add up to {event.entriesPerPerson}!
              </p>
            )}
          </div>
        )}

        {/* All Entries (SCORING: bags, REVEAL/COMPLETE: all) */}
        {(event.status === "SCORING" || isRevealed) && (
          <div className="wine-card space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-wine text-lg text-[#F0E3C7]">
                {typeInfo.emoji} {isRevealed ? "All Entries" : "Bags"}
              </h3>
              {event.status === "SCORING" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Blind
                </span>
              )}
            </div>
            {(isRevealed ? entries : assignedEntries).length > 0 ? (
              <div className="space-y-3">
                {(isRevealed ? entries : assignedEntries)
                  .sort((a, b) => {
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
              <p className="text-center text-sm text-[#A08060] py-4">
                {event.status === "SCORING"
                  ? "No bags assigned yet. The host needs to assign bag numbers."
                  : "No entries yet."}
              </p>
            )}
          </div>
        )}

        {/* SETUP entries (admin sees all) */}
        {event.status === "SETUP" && entries.length > 0 && (
          <div className="wine-card space-y-4">
            <h3 className="font-wine text-lg text-[#F0E3C7]">
              {typeInfo.emoji} Entries ({entries.length})
            </h3>
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
          </div>
        )}

        {/* Score Breakdown Table (REVEAL/COMPLETE) */}
        {isRevealed && entries.length > 0 && (
          <ScoreBreakdownTable entries={entries} />
        )}

        {/* Best Palate Card (REVEAL/COMPLETE) */}
        {isRevealed && event.bestPalateMemberId && (
          <div className="wine-card-gold p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-2xl">
                🎯
              </div>
              <div>
                <p className="font-wine text-lg font-semibold text-purple-300">Best Palate Award</p>
                <p className="text-sm text-[#A08060]">
                  Closest to group consensus (distance: {event.bestPalateScore?.toFixed(1) ?? "?"})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bets */}
        {bets.length > 0 && (
          <div className="wine-card space-y-4">
            <h3 className="font-wine text-lg text-[#F0E3C7] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Bets ({bets.length})
            </h3>
            <div className="space-y-3">
              {bets.map((bet) => (
                <WineBetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* Scores (REVEAL/COMPLETE) */}
        {scores.length > 0 && isRevealed && (
          <div className="wine-card space-y-4">
            <h3 className="font-wine text-lg text-[#F0E3C7] flex items-center gap-2">
              <Star className="h-5 w-5 text-[#C9A040]" />
              Scores ({scores.length})
            </h3>
            <div className="space-y-2">
              {scores.map((score) => {
                const scorerName = score.member?.user?.name || score.member?.guestName || "Guest";
                return (
                  <div
                    key={score.id}
                    className="flex items-center gap-3 rounded-xl bg-[#160407] p-3"
                  >
                    <UserAvatar name={scorerName} src={score.member?.user?.avatarUrl} size="sm" />
                    <span className="text-sm text-[#F0E3C7]">{scorerName}</span>
                    {score.submittedAt && (
                      <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Submitted
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reveal Sequence */}
        {confettiOpen && revealResults && (
          <RevealSequence
            results={revealResults}
            contestType={event.contestType}
            onComplete={() => setConfettiOpen(false)}
          />
        )}

        {/* Phase Transition Button */}
        {nextStatus && (
          <div className="space-y-2">
            <button
              onClick={() => handleStatusAdvance(nextStatus)}
              disabled={
                updateEvent.isPending || revealWinners.isPending ||
                (nextStatus === "SCORING" && entries.length < 2) ||
                (nextStatus === "REVEAL" && submittedScoreCount < 1)
              }
              className={nextStatus === "REVEAL" ? "wine-btn" : "wine-btn-ghost w-full"}
            >
              {nextStatus === "REVEAL" ? <Trophy className="h-4 w-4" /> :
               nextStatus === "COMPLETE" ? <Eye className="h-4 w-4" /> :
               <ArrowRight className="h-4 w-4" />}
              {NEXT_STATUS_LABELS[nextStatus]}
              {nextStatus === "SCORING" && entries.length < 2 && (
                <span className="text-xs opacity-75">(need 2+ entries)</span>
              )}
            </button>
            {nextStatus === "REVEAL" && submittedScoreCount < 1 && (
              <p className="text-center text-xs text-amber-400/80">
                At least 1 person must score before revealing
              </p>
            )}
            {advanceError && (
              <p className="text-center text-xs text-red-400 bg-red-400/10 rounded-lg p-2">
                {advanceError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <WineEventFormModal
        open={eventFormOpen}
        onOpenChange={handleEventFormClose}
        tripId={tripId}
        event={event}
      />

      <WineEntryFormModal
        open={entryFormOpen}
        onOpenChange={handleEntryFormClose}
        tripId={tripId}
        eventId={eventId}
        entry={editingEntry}
        contestType={event.contestType}
        entriesRemaining={entriesRemaining}
      />

      {/* Place Bet Dialog */}
      <Dialog open={betOpen} onOpenChange={setBetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#C9A040]" />
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
