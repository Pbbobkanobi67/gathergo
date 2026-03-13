"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";

interface VoterProgress {
  memberId: string;
  name: string;
  avatarUrl: string | null;
  bottlesScored: number;
  totalBottles: number;
  complete: boolean;
}

interface VoterProgressPanelProps {
  voters: VoterProgress[];
}

export function VoterProgressPanel({ voters }: VoterProgressPanelProps) {
  if (voters.length === 0) return null;

  const completedCount = voters.filter((v) => v.complete).length;

  return (
    <Card className="border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="text-slate-200">Tasters</span>
          <span className="text-xs text-slate-400">
            {completedCount}/{voters.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {voters.map((voter) => {
            const progress = voter.totalBottles > 0
              ? (voter.bottlesScored / voter.totalBottles) * 100
              : 0;

            return (
              <div
                key={voter.memberId}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  voter.complete
                    ? "border-green-500/30 bg-green-500/5"
                    : voter.bottlesScored > 0
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <UserAvatar name={voter.name} src={voter.avatarUrl} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {voter.name}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                      {voter.complete ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </span>
                      ) : voter.bottlesScored > 0 ? (
                        `${voter.bottlesScored}/${voter.totalBottles}`
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Circle className="h-3 w-3" />
                          Waiting
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-700">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        voter.complete ? "bg-green-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
