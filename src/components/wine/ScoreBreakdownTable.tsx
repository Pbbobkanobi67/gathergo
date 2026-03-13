"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import type { WineEntryWithSubmitter } from "@/types";

interface ScoreBreakdownTableProps {
  entries: WineEntryWithSubmitter[];
}

export function ScoreBreakdownTable({ entries }: ScoreBreakdownTableProps) {
  // Sort by finalPlace first, then by avgScore desc
  const sorted = [...entries]
    .filter((e) => e.bagNumber !== null)
    .sort((a, b) => {
      if (a.finalPlace && b.finalPlace) return a.finalPlace - b.finalPlace;
      if (a.finalPlace) return -1;
      if (b.finalPlace) return 1;
      return (b.avgScore ?? 0) - (a.avgScore ?? 0);
    });

  if (sorted.length === 0) return null;

  return (
    <Card className="border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-400" />
          Score Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                <th className="pb-2 pr-2">Rank</th>
                <th className="pb-2 pr-2">Bag</th>
                <th className="pb-2 pr-2">Wine</th>
                <th className="pb-2 pr-2 text-center">Avg Score</th>
                <th className="pb-2 pr-2 text-center">Voters</th>
                <th className="pb-2">Bringer</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, idx) => {
                const submitterName = entry.submittedBy?.user?.name || entry.submittedBy?.guestName || "Unknown";
                const rowColor =
                  entry.finalPlace === 1
                    ? "bg-amber-500/10"
                    : entry.finalPlace === 2
                    ? "bg-slate-400/5"
                    : entry.finalPlace === 3
                    ? "bg-orange-500/5"
                    : "";
                const medal =
                  entry.finalPlace === 1 ? "\u{1F947}" : entry.finalPlace === 2 ? "\u{1F948}" : entry.finalPlace === 3 ? "\u{1F949}" : "";

                return (
                  <tr key={entry.id} className={`border-b border-slate-700/50 ${rowColor}`}>
                    <td className="py-2 pr-2">
                      <span className="text-base">{medal || idx + 1}</span>
                    </td>
                    <td className="py-2 pr-2 text-purple-400 font-medium">#{entry.bagNumber}</td>
                    <td className="py-2 pr-2">
                      <div>
                        <p className="font-medium text-slate-200 truncate max-w-[150px]">{entry.wineName}</p>
                        {entry.winery && <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{entry.winery}</p>}
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-center">
                      <span className="font-bold text-amber-400">{entry.avgScore?.toFixed(1) ?? "--"}</span>
                      <span className="text-[10px] text-slate-500">/10</span>
                    </td>
                    <td className="py-2 pr-2 text-center text-slate-400">{entry.totalVoters ?? 0}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar
                          name={submitterName}
                          src={entry.submittedBy?.user?.avatarUrl}
                          size="sm"
                        />
                        <span className="text-xs text-slate-300 truncate max-w-[80px]">{submitterName}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
