"use client";

import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { HOOD_BUCKS } from "@/constants";
import type { WineBetSummary } from "@/types";

interface WineBetCardProps {
  bet: WineBetSummary;
}

export function WineBetCard({ bet }: WineBetCardProps) {
  const betterName = bet.member?.user?.name || bet.member?.guestName || "Guest";

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
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
}
