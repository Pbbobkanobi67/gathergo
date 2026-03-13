"use client";

import { CheckCircle2, Circle } from "lucide-react";
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
    <div className="wine-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-wine text-lg text-[#F0E3C7]">Tasters</h3>
        <span className="text-xs text-[#A08060]">
          {completedCount}/{voters.length} done
        </span>
      </div>
      <div className="space-y-2">
        {voters.map((voter) => {
          const progress = voter.totalBottles > 0
            ? (voter.bottlesScored / voter.totalBottles) * 100
            : 0;

          return (
            <div
              key={voter.memberId}
              className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                voter.complete
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : voter.bottlesScored > 0
                  ? "bg-[#C9A040]/5 border border-[#C9A040]/15"
                  : "bg-[#160407] border border-[#A08060]/15"
              }`}
            >
              <UserAvatar name={voter.name} src={voter.avatarUrl} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[#F0E3C7] truncate font-wine">
                    {voter.name}
                  </span>
                  <span className="text-xs shrink-0 ml-2">
                    {voter.complete ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : voter.bottlesScored > 0 ? (
                      <span className="text-[#C9A040]">
                        {voter.bottlesScored}/{voter.totalBottles}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#A08060]/60">
                        <Circle className="h-3 w-3" />
                        Waiting
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full rounded-full bg-[#A08060]/15">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${
                      voter.complete
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-[#C9A040] to-[#D4B050]"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
