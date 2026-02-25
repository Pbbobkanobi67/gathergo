"use client";

import { useState } from "react";
import { Settings2, Shield, Utensils, Heart, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUpdateMember, useRemoveMember, type MemberWithUser } from "@/hooks/useMembers";
import { RSVP_STATUSES, MEMBER_ROLES } from "@/constants";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithUser | null;
  tripId: string;
  isOrganizer: boolean;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  tripId,
  isOrganizer,
}: EditMemberDialogProps) {
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [isCouple, setIsCouple] = useState(false);
  const [couplePartnerName, setCouplePartnerName] = useState("");
  const [notes, setNotes] = useState("");
  const [role, setRole] = useState("GUEST");
  const [rsvpStatus, setRsvpStatus] = useState("PENDING");

  const memberKey = member?.id;
  const prevMemberKey = useState<string | undefined>(undefined);
  if (memberKey && memberKey !== prevMemberKey[0]) {
    prevMemberKey[1](memberKey);
    setGuestName(member!.user?.name || member!.guestName || "");
    setGuestPhone(member!.guestPhone || "");
    setDietaryRestrictions(member!.dietaryRestrictions || "");
    setAllergies(member!.allergies || "");
    setIsCouple(member!.isCouple);
    setCouplePartnerName(member!.couplePartnerName || "");
    setNotes(member!.notes || "");
    setRole(member!.role);
    setRsvpStatus(member!.rsvpStatus);
    setShowRemoveConfirm(false);
  }

  if (!member) return null;

  const memberName = member.user?.name || member.guestName || "Guest";
  const isOrganizerMember = member.role === "ORGANIZER";

  const handleSave = async () => {
    const data: Record<string, unknown> = {
      guestName,
      guestPhone: guestPhone || undefined,
      dietaryRestrictions: dietaryRestrictions || undefined,
      allergies: allergies || undefined,
      isCouple,
      couplePartnerName: isCouple ? couplePartnerName : undefined,
      notes: notes || undefined,
    };

    if (isOrganizer) {
      data.role = role;
    }

    try {
      await updateMember.mutateAsync({
        tripId,
        memberId: member.id,
        data,
      });
      onOpenChange(false);
    } catch {
      // Error available on updateMember.error
    }
  };

  const handleRsvpChange = async (newStatus: string) => {
    setRsvpStatus(newStatus);
    try {
      await updateMember.mutateAsync({
        tripId,
        memberId: member.id,
        data: { rsvpStatus: newStatus },
      });
    } catch {
      // Revert on error
      setRsvpStatus(member.rsvpStatus);
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({ tripId, memberId: member.id });
      onOpenChange(false);
    } catch {
      // Error available on removeMember.error
    }
  };

  const roleOptions = MEMBER_ROLES.map((r) => ({
    value: r.value,
    label: r.label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-teal-400" />
            {memberName}
          </DialogTitle>
          <DialogDescription>
            {member.user?.email || member.guestEmail || "No email"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* RSVP Status */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              RSVP Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {RSVP_STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => handleRsvpChange(status.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    rsvpStatus === status.value
                      ? status.value === "CONFIRMED"
                        ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
                        : status.value === "MAYBE"
                        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50"
                        : status.value === "DECLINED"
                        ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                        : "bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/50"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {status.icon} {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role (organizer only) */}
          {isOrganizer && !isOrganizerMember && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                Role
              </Label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={roleOptions}
              />
            </div>
          )}

          {isOrganizerMember && (
            <div className="flex items-center gap-2">
              <Badge variant="default">Organizer</Badge>
              <span className="text-xs text-slate-400">Role cannot be changed</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input
              id="edit-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Couple Info */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCouple}
                onChange={(e) => setIsCouple(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
              />
              <span className="flex items-center gap-2 text-sm text-slate-200">
                <Heart className="h-4 w-4 text-pink-400" />
                Attending as a couple
              </span>
            </label>
            {isCouple && (
              <Input
                placeholder="Partner's name"
                value={couplePartnerName}
                onChange={(e) => setCouplePartnerName(e.target.value)}
              />
            )}
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-2">
            <Label htmlFor="edit-dietary" className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-slate-400" />
              Dietary Restrictions
            </Label>
            <Textarea
              id="edit-dietary"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="e.g., Vegetarian, Gluten-free..."
              rows={2}
            />
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <Label htmlFor="edit-allergies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Allergies
            </Label>
            <Textarea
              id="edit-allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g., Peanuts, Shellfish..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Hood Bucks Balance */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Hood Bucks Balance</span>
              <span className="font-semibold text-amber-400">
                {member.hoodBucksBalance} HB
              </span>
            </div>
          </div>

          {/* Error Messages */}
          {updateMember.isError && (
            <p className="text-sm text-red-400">{updateMember.error.message}</p>
          )}
          {removeMember.isError && (
            <p className="text-sm text-red-400">{removeMember.error.message}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row">
          {/* Remove Member (organizer only, not for organizer member) */}
          {isOrganizer && !isOrganizerMember && (
            <div className="flex-1">
              {showRemoveConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">Remove?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    isLoading={removeMember.isPending}
                  >
                    Yes, Remove
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  Remove Guest
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={updateMember.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
