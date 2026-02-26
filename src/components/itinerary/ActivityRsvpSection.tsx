"use client";

import { ActivityRsvp, MemberInfo } from "@/hooks/useItinerary";
import { useRespondRsvp } from "@/hooks/useActivityRsvp";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Check, X, HelpCircle } from "lucide-react";

interface ActivityRsvpSectionProps {
  tripId: string;
  activityId: string;
  rsvps: ActivityRsvp[];
  currentMemberId: string | null;
}

const statusColors: Record<string, string> = {
  INVITED: "ring-slate-500",
  ACCEPTED: "ring-green-500",
  DECLINED: "ring-red-500",
  MAYBE: "ring-amber-500",
};

export function ActivityRsvpSection({ tripId, activityId, rsvps, currentMemberId }: ActivityRsvpSectionProps) {
  const respondRsvp = useRespondRsvp();

  if (rsvps.length === 0) return null;

  const counts = {
    ACCEPTED: rsvps.filter((r) => r.status === "ACCEPTED").length,
    DECLINED: rsvps.filter((r) => r.status === "DECLINED").length,
    MAYBE: rsvps.filter((r) => r.status === "MAYBE").length,
    INVITED: rsvps.filter((r) => r.status === "INVITED").length,
  };

  const myRsvp = currentMemberId ? rsvps.find((r) => r.memberId === currentMemberId) : null;

  const handleRespond = (status: "ACCEPTED" | "DECLINED" | "MAYBE") => {
    respondRsvp.mutate({ tripId, activityId, status });
  };

  return (
    <div className="mt-2 space-y-2">
      {/* RSVP avatars */}
      <div className="flex items-center gap-1">
        <div className="flex -space-x-1.5">
          {rsvps.slice(0, 6).map((r) => {
            const name = r.member.user?.name || r.member.guestName || "?";
            return (
              <div
                key={r.id}
                className={`h-6 w-6 rounded-full ring-2 ${statusColors[r.status]} overflow-hidden`}
                title={`${name}: ${r.status.toLowerCase()}`}
              >
                {r.member.user?.avatarUrl ? (
                  <img src={r.member.user.avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-600 text-[9px] font-medium text-slate-300">
                    {getInitials(name)}
                  </div>
                )}
              </div>
            );
          })}
          {rsvps.length > 6 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-500 text-[9px] text-slate-300">
              +{rsvps.length - 6}
            </div>
          )}
        </div>
        <span className="ml-2 text-[11px] text-slate-400">
          {counts.ACCEPTED > 0 && <span className="text-green-400">{counts.ACCEPTED} yes</span>}
          {counts.MAYBE > 0 && <span className="ml-1 text-amber-400">{counts.MAYBE} maybe</span>}
          {counts.DECLINED > 0 && <span className="ml-1 text-red-400">{counts.DECLINED} no</span>}
          {counts.INVITED > 0 && <span className="ml-1 text-slate-400">{counts.INVITED} pending</span>}
        </span>
      </div>

      {/* Current user's RSVP action buttons */}
      {myRsvp && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">RSVP:</span>
          <Button
            variant={myRsvp.status === "ACCEPTED" ? "default" : "outline"}
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => handleRespond("ACCEPTED")}
            disabled={respondRsvp.isPending}
          >
            <Check className="h-3 w-3" /> Yes
          </Button>
          <Button
            variant={myRsvp.status === "MAYBE" ? "default" : "outline"}
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => handleRespond("MAYBE")}
            disabled={respondRsvp.isPending}
          >
            <HelpCircle className="h-3 w-3" /> Maybe
          </Button>
          <Button
            variant={myRsvp.status === "DECLINED" ? "destructive" : "outline"}
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => handleRespond("DECLINED")}
            disabled={respondRsvp.isPending}
          >
            <X className="h-3 w-3" /> No
          </Button>
        </div>
      )}
    </div>
  );
}
