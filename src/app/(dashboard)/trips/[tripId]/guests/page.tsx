"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Search,
  Heart,
  Utensils,
  AlertTriangle,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { InviteGuestDialog } from "@/components/guests/InviteGuestDialog";
import { EditMemberDialog } from "@/components/guests/EditMemberDialog";
import { useTrip } from "@/hooks/useTrip";
import { useMembers, type MemberWithUser } from "@/hooks/useMembers";
import { RSVP_STATUSES } from "@/constants";

export default function GuestsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: trip } = useTrip(tripId);
  const { data: members, isLoading } = useMembers(tripId);

  const [search, setSearch] = useState("");
  const [filterRsvp, setFilterRsvp] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<MemberWithUser | null>(null);

  if (isLoading) {
    return <LoadingPage message="Loading guests..." />;
  }

  const filtered = (members || []).filter((m) => {
    const name = m.user?.name || m.guestName || "";
    const email = m.user?.email || m.guestEmail || "";
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());
    const matchesRsvp = !filterRsvp || m.rsvpStatus === filterRsvp;
    return matchesSearch && matchesRsvp;
  });

  const rsvpCounts = {
    CONFIRMED: members?.filter((m) => m.rsvpStatus === "CONFIRMED").length || 0,
    PENDING: members?.filter((m) => m.rsvpStatus === "PENDING").length || 0,
    MAYBE: members?.filter((m) => m.rsvpStatus === "MAYBE").length || 0,
    DECLINED: members?.filter((m) => m.rsvpStatus === "DECLINED").length || 0,
  };

  const totalGuests = members?.length || 0;
  const coupleCount = members?.filter((m) => m.isCouple).length || 0;
  const headcount = totalGuests + coupleCount;

  const getRsvpBadge = (status: string) => {
    const info = RSVP_STATUSES.find((s) => s.value === status);
    const variant =
      status === "CONFIRMED"
        ? "success"
        : status === "MAYBE"
        ? "warning"
        : status === "DECLINED"
        ? "destructive"
        : "secondary";
    return (
      <Badge variant={variant as "success" | "warning" | "destructive" | "secondary"}>
        {info?.icon} {info?.label || status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === "ORGANIZER") return <Badge variant="default">Organizer</Badge>;
    if (role === "CO_ORGANIZER") return <Badge variant="purple">Co-Organizer</Badge>;
    return null;
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
            <h1 className="text-2xl font-bold text-slate-100">Guest List</h1>
            <p className="text-sm text-slate-400">
              {headcount} {headcount === 1 ? "person" : "people"} attending
              {coupleCount > 0 && ` (${coupleCount} ${coupleCount === 1 ? "couple" : "couples"})`}
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Guest
        </Button>
      </div>

      {/* RSVP Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RSVP_STATUSES.map((status) => {
          const count = rsvpCounts[status.value as keyof typeof rsvpCounts];
          const isActive = filterRsvp === status.value;
          return (
            <button
              key={status.value}
              onClick={() => setFilterRsvp(isActive ? null : status.value)}
              className={`rounded-xl border p-3 text-center transition-colors ${
                isActive
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <p className="text-2xl font-bold text-slate-100">{count}</p>
              <p className="text-xs text-slate-400">
                {status.icon} {status.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Guest List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((member) => {
            const name = member.user?.name || member.guestName || "Guest";
            const email = member.user?.email || member.guestEmail || "";
            const avatarUrl = member.user?.avatarUrl || null;

            return (
              <Card
                key={member.id}
                className="cursor-pointer transition-colors hover:border-slate-600"
                onClick={() => setEditMember(member)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <UserAvatar name={name} src={avatarUrl} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium text-slate-100">
                        {name}
                      </h3>
                      {getRoleBadge(member.role)}
                      {member.isCouple && (
                        <span className="flex items-center gap-1 text-xs text-pink-400">
                          <Heart className="h-3 w-3" />
                          {member.couplePartnerName && `+ ${member.couplePartnerName}`}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {email}
                        </span>
                      )}
                      {member.guestPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.guestPhone}
                        </span>
                      )}
                    </div>

                    {/* Dietary / Allergy Tags */}
                    {(member.dietaryRestrictions || member.allergies) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {member.dietaryRestrictions && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                            <Utensils className="h-3 w-3" />
                            {member.dietaryRestrictions}
                          </span>
                        )}
                        {member.allergies && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {member.allergies}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getRsvpBadge(member.rsvpStatus)}
                    <MoreVertical className="h-4 w-4 text-slate-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={search || filterRsvp ? "No guests match" : "No guests yet"}
          description={
            search || filterRsvp
              ? "Try adjusting your search or filter."
              : "Share the invite link to get your crew together."
          }
          actionLabel={!search && !filterRsvp ? "Invite Guests" : undefined}
          onAction={!search && !filterRsvp ? () => setInviteOpen(true) : undefined}
        />
      )}

      {/* Dialogs */}
      <InviteGuestDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tripId={tripId}
        inviteToken={trip?.inviteToken || ""}
      />

      <EditMemberDialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        member={editMember}
        tripId={tripId}
        isOrganizer={true}
      />
    </div>
  );
}
