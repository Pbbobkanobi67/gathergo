"use client";

import { Hash, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveLeaderboard } from "@/hooks/useWineEventDetail";

interface LiveLeaderboardProps {
  tripId: string;
  eventId: string;
}

export function LiveLeaderboard({ tripId, eventId }: LiveLeaderboardProps) {
  const { data, isLoading } = useLiveLeaderboard(tripId, eventId);

  if (isLoading || !data) return null;

  const { leaderboard, totalVoters, totalMembers, currentUserScored } = data;
  const maxScore = Math.max(...leaderboard.map((e) => e.avgScore), 1);

  return (
    <Card className="border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            Live Scores
          </span>
          <div className="flex items-center gap-2">
            {currentUserScored && (
              <Badge variant="success" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Scored
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {totalVoters}/{totalMembers} voted
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${totalMembers > 0 ? (totalVoters / totalMembers) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const barWidth = maxScore > 0 ? (entry.avgScore / maxScore) * 100 : 0;

            return (
              <div key={entry.entryId} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-sm font-bold text-purple-400">
                  <Hash className="mr-0.5 h-3 w-3" />
                  {entry.bagNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="relative h-6 rounded-md bg-slate-700/50 overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-md transition-all duration-500 ${
                        idx === 0 ? "bg-amber-500/40" : idx === 1 ? "bg-slate-400/30" : idx === 2 ? "bg-orange-500/30" : "bg-teal-500/20"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2">
                      <span className="text-xs font-medium text-slate-200">
                        Bag #{entry.bagNumber}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {entry.avgScore > 0 ? entry.avgScore.toFixed(1) : "--"}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 w-8 text-right shrink-0">
                  {entry.voterCount}v
                </span>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <p className="text-center text-sm text-slate-500">No scores submitted yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
