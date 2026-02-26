"use client";

import { MemberInfo, ActivityRsvp } from "@/hooks/useItinerary";
import { getInitials } from "@/lib/utils";

interface MemberMultiSelectProps {
  members: MemberInfo[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  existingRsvps?: ActivityRsvp[];
}

const RSVP_BADGE: Record<string, { label: string; class: string }> = {
  INVITED: { label: "Invited", class: "bg-slate-600 text-slate-300" },
  ACCEPTED: { label: "Accepted", class: "bg-green-500/20 text-green-300" },
  DECLINED: { label: "Declined", class: "bg-red-500/20 text-red-300" },
  MAYBE: { label: "Maybe", class: "bg-amber-500/20 text-amber-300" },
};

export function MemberMultiSelect({ members, selectedIds, onChange, existingRsvps = [] }: MemberMultiSelectProps) {
  const rsvpMap = new Map(existingRsvps.map((r) => [r.memberId, r.status]));

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-2">
      {members.map((m) => {
        const name = m.user?.name || m.guestName || "Unknown";
        const checked = selectedIds.includes(m.id);
        const rsvpStatus = rsvpMap.get(m.id);
        const badge = rsvpStatus ? RSVP_BADGE[rsvpStatus] : null;

        return (
          <label
            key={m.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-700/50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(m.id)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500/20"
            />
            {m.user?.avatarUrl ? (
              <img src={m.user.avatarUrl} alt={name} className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-[10px] font-medium text-slate-300">
                {getInitials(name)}
              </div>
            )}
            <span className="flex-1 truncate text-sm text-slate-200">{name}</span>
            {badge && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.class}`}>
                {badge.label}
              </span>
            )}
          </label>
        );
      })}
      {members.length === 0 && (
        <p className="py-2 text-center text-xs text-slate-500">No members available</p>
      )}
    </div>
  );
}
