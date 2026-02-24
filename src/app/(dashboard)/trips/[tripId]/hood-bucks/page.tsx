"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useTripLeaderboard, useGrantBonus } from "@/hooks/useHoodBucks";
import { useMembers } from "@/hooks/useMembers";
import { HOOD_BUCKS } from "@/constants";

export default function HoodBucksPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: leaderboard, isLoading } = useTripLeaderboard(tripId);
  const { data: members } = useMembers(tripId);
  const grantBonus = useGrantBonus();

  const [grantOpen, setGrantOpen] = useState(false);
  const [bonus, setBonus] = useState({
    memberId: "",
    amount: "50",
    description: "",
  });

  if (isLoading) {
    return <LoadingPage message="Loading Hood Bucks..." />;
  }

  const handleGrant = async () => {
    if (!bonus.memberId || !bonus.amount) return;
    try {
      await grantBonus.mutateAsync({
        memberId: bonus.memberId,
        amount: parseInt(bonus.amount),
        description: bonus.description || "Bonus grant",
        tripId,
      });
      setBonus({ memberId: "", amount: "50", description: "" });
      setGrantOpen(false);
    } catch {
      // Error on grantBonus.error
    }
  };

  const memberOptions = (members || []).map((m) => ({
    value: m.id,
    label: m.user?.name || m.guestName || "Guest",
  }));

  const totalPool =
    leaderboard?.reduce((sum, entry) => sum + entry.balance, 0) || 0;
  const topBalance = leaderboard?.[0]?.balance || 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <span className="text-2xl" title="1st Place">
          🥇
        </span>
      );
    if (rank === 2)
      return (
        <span className="text-2xl" title="2nd Place">
          🥈
        </span>
      );
    if (rank === 3)
      return (
        <span className="text-2xl" title="3rd Place">
          🥉
        </span>
      );
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-300">
        {rank}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-slate-100">
              {HOOD_BUCKS.CURRENCY_ICON} Hood Bucks
            </h1>
            <p className="text-sm text-slate-400">
              Leaderboard &amp; Balances
            </p>
          </div>
        </div>
        <Button onClick={() => setGrantOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Grant Bonus
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {totalPool.toLocaleString()} {HOOD_BUCKS.CURRENCY_SYMBOL}
          </p>
          <p className="text-xs text-slate-400">Total in Circulation</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-100">
            {leaderboard?.length || 0}
          </p>
          <p className="text-xs text-slate-400">Players</p>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center sm:col-span-1">
          <p className="text-2xl font-bold text-green-400">
            {topBalance.toLocaleString()} {HOOD_BUCKS.CURRENCY_SYMBOL}
          </p>
          <p className="text-xs text-slate-400">Highest Balance</p>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-400" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const barWidth =
                  topBalance > 0
                    ? Math.max((entry.balance / topBalance) * 100, 5)
                    : 5;
                const isPositive =
                  entry.balance >= HOOD_BUCKS.INITIAL_BALANCE;

                return (
                  <div
                    key={entry.memberId}
                    className={`rounded-xl border p-4 transition-colors ${
                      entry.rank === 1
                        ? "border-amber-500/30 bg-amber-500/5"
                        : entry.rank === 2
                        ? "border-slate-400/30 bg-slate-400/5"
                        : entry.rank === 3
                        ? "border-orange-500/30 bg-orange-500/5"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getRankBadge(entry.rank)}
                      <UserAvatar
                        name={entry.name}
                        src={entry.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-100">
                            {entry.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <span
                              className={`text-lg font-bold ${
                                isPositive
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {entry.balance.toLocaleString()}
                            </span>
                            <span className="text-sm text-slate-400">
                              {HOOD_BUCKS.CURRENCY_SYMBOL}
                            </span>
                          </div>
                        </div>
                        {/* Balance bar */}
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              entry.rank === 1
                                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                : entry.rank === 2
                                ? "bg-gradient-to-r from-slate-400 to-slate-300"
                                : entry.rank === 3
                                ? "bg-gradient-to-r from-orange-500 to-orange-400"
                                : "bg-gradient-to-r from-teal-500 to-teal-400"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Hood Bucks data"
          description="Hood Bucks are earned through wine tasting events and bonuses. Add members to your trip to get started!"
        />
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Hood Bucks Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-400">
                <Award className="h-4 w-4" />
                Starting Balance
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {HOOD_BUCKS.INITIAL_BALANCE} {HOOD_BUCKS.CURRENCY_SYMBOL}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Everyone starts with {HOOD_BUCKS.INITIAL_BALANCE} Hood Bucks
                per trip
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-400">
                <TrendingUp className="h-4 w-4" />
                Win Multiplier
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {HOOD_BUCKS.BET_WIN_MULTIPLIER}x
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Winning bets pay out at {HOOD_BUCKS.BET_WIN_MULTIPLIER}x your
                wager
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-400">
                <Trophy className="h-4 w-4" />
                Wine Events
              </div>
              <p className="text-2xl font-bold text-slate-100">Bet &amp; Win</p>
              <p className="mt-1 text-xs text-slate-400">
                Place bets during blind tastings. Guess correctly to earn more!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grant Bonus Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Grant Hood Bucks Bonus
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bonus-member" required>
                Member
              </Label>
              <Select
                id="bonus-member"
                placeholder="Select member..."
                options={memberOptions}
                value={bonus.memberId}
                onChange={(e) =>
                  setBonus({ ...bonus, memberId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus-amount" required>
                Amount ({HOOD_BUCKS.CURRENCY_SYMBOL})
              </Label>
              <Input
                id="bonus-amount"
                type="number"
                value={bonus.amount}
                onChange={(e) =>
                  setBonus({ ...bonus, amount: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus-desc">Reason</Label>
              <Input
                id="bonus-desc"
                placeholder="e.g., Best campfire story"
                value={bonus.description}
                onChange={(e) =>
                  setBonus({ ...bonus, description: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGrant}
              isLoading={grantBonus.isPending}
              disabled={!bonus.memberId || !bonus.amount}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Grant Bonus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
