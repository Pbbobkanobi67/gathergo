"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, ChevronDown, ChevronRight, Link2, DollarSign, Users, Utensils, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { MemberMultiSelect } from "@/components/itinerary/MemberMultiSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateActivity, useUpdateActivity, type Activity, type MemberInfo, type ActivityCategoryType } from "@/hooks/useItinerary";
import { useSendRsvps } from "@/hooks/useActivityRsvp";
import { ACTIVITY_CATEGORIES } from "@/constants";

interface MealOption { id: string; title: string | null; mealType: string; date: string }
interface WineEventOption { id: string; title: string; date: string }

interface ActivityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  dayId?: string;
  activity?: Activity | null; // null = create mode, object = edit mode
  members: MemberInfo[];
  meals?: MealOption[];
  wineEvents?: WineEventOption[];
}

function timeFromISO(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const defaultForm = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  location: "",
  category: "OTHER" as ActivityCategoryType,
  reservationUrl: "",
  confirmationCode: "",
  cost: "",
  paidBy: "",
  assignedToMemberId: "",
  linkedMealId: "",
  linkedWineEventId: "",
  status: "IDEA" as "IDEA" | "VOTING" | "CONFIRMED" | "COMPLETED",
};

export function ActivityFormModal({
  open,
  onOpenChange,
  tripId,
  dayId,
  activity,
  members,
  meals = [],
  wineEvents = [],
}: ActivityFormModalProps) {
  const isEdit = !!activity;
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const sendRsvps = useSendRsvps();

  const [form, setForm] = useState(defaultForm);
  const [rsvpMemberIds, setRsvpMemberIds] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [showCrossLinks, setShowCrossLinks] = useState(false);

  useEffect(() => {
    if (open && activity) {
      setForm({
        title: activity.title,
        description: activity.description || "",
        startTime: timeFromISO(activity.startTime),
        endTime: timeFromISO(activity.endTime),
        location: activity.location || "",
        category: activity.category,
        reservationUrl: activity.reservationUrl || "",
        confirmationCode: activity.confirmationCode || "",
        cost: activity.cost != null ? String(activity.cost) : "",
        paidBy: activity.paidBy || "",
        assignedToMemberId: activity.assignedToMemberId || "",
        linkedMealId: activity.linkedMealId || "",
        linkedWineEventId: activity.linkedWineEventId || "",
        status: activity.status,
      });
      setRsvpMemberIds(activity.rsvps?.map((r) => r.memberId) || []);
      // Expand sections if data is present
      setShowLinks(!!(activity.reservationUrl || activity.confirmationCode));
      setShowCost(!!(activity.cost != null && activity.cost > 0));
      setShowCrossLinks(!!(activity.linkedMealId || activity.linkedWineEventId));
    } else if (open) {
      setForm(defaultForm);
      setRsvpMemberIds([]);
      setShowLinks(false);
      setShowCost(false);
      setShowCrossLinks(false);
    }
  }, [open, activity]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const buildTimeISO = (timeStr: string, dayDate?: string): string | undefined => {
    if (!timeStr) return undefined;
    // Use a base date for the time; itinerary day date or today
    const base = dayDate ? new Date(dayDate) : new Date();
    const [h, m] = timeStr.split(":").map(Number);
    base.setUTCHours(h, m, 0, 0);
    return base.toISOString();
  };

  // Get the day date from the activity's itinerary day if editing
  const dayDate = activity?.startTime ? activity.startTime : undefined;

  const handleSubmit = async () => {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      startTime: buildTimeISO(form.startTime, dayDate) || undefined,
      endTime: buildTimeISO(form.endTime, dayDate) || undefined,
      location: form.location || undefined,
      category: form.category,
      reservationUrl: form.reservationUrl || undefined,
      confirmationCode: form.confirmationCode || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      paidBy: form.paidBy || undefined,
      assignedToMemberId: form.assignedToMemberId || undefined,
      linkedMealId: form.linkedMealId || null,
      linkedWineEventId: form.linkedWineEventId || null,
    };

    try {
      if (isEdit && activity) {
        await updateActivity.mutateAsync({
          tripId,
          activityId: activity.id,
          data: { ...payload, status: form.status },
        });

        // Update RSVPs if changed
        const existingIds = (activity.rsvps || []).map((r) => r.memberId).sort().join(",");
        const newIds = [...rsvpMemberIds].sort().join(",");
        if (existingIds !== newIds && rsvpMemberIds.length > 0) {
          await sendRsvps.mutateAsync({ tripId, activityId: activity.id, memberIds: rsvpMemberIds });
        }
      } else {
        const created = await createActivity.mutateAsync({
          tripId,
          itineraryDayId: dayId,
          ...payload,
        });

        // Send RSVPs for newly created activity
        if (rsvpMemberIds.length > 0) {
          await sendRsvps.mutateAsync({ tripId, activityId: created.id, memberIds: rsvpMemberIds });
        }
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createActivity.isPending || updateActivity.isPending;

  const categoryOptions = ACTIVITY_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  const statusOptions = [
    { value: "IDEA", label: "Idea" },
    { value: "VOTING", label: "Voting" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const memberOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({
      value: m.id,
      label: m.user?.name || m.guestName || "Unknown",
    })),
  ];

  const mealOptions = [
    { value: "", label: "None" },
    ...meals.map((m) => ({
      value: m.id,
      label: m.title || m.mealType,
    })),
  ];

  const wineEventOptions = [
    { value: "", label: "None" },
    ...wineEvents.map((w) => ({
      value: w.id,
      label: w.title,
    })),
  ];

  const SectionToggle = ({ label, icon: Icon, open: isOpen, onToggle }: { label: string; icon: React.ElementType; open: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">{label}</span>
      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-teal-400" /> : <Plus className="h-5 w-5 text-teal-400" />}
            {isEdit ? "Edit Activity" : "Add Activity"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="act-title" required>Title</Label>
            <Input
              id="act-title"
              placeholder="e.g., Hiking at Emerald Bay"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Category + Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="act-category">Category</Label>
              <Select
                id="act-category"
                options={categoryOptions}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="act-status">Status</Label>
                <Select
                  id="act-status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePicker value={form.startTime} onChange={(v) => set("startTime", v)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <TimePicker value={form.endTime} onChange={(v) => set("endTime", v)} />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="act-location">Location</Label>
            <Input
              id="act-location"
              placeholder="e.g., Emerald Bay State Park"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="act-desc">Description</Label>
            <Textarea
              id="act-desc"
              placeholder="Details about this activity..."
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <Label htmlFor="act-assigned">Assigned To</Label>
            <Select
              id="act-assigned"
              options={memberOptions}
              value={form.assignedToMemberId}
              onChange={(e) => set("assignedToMemberId", e.target.value)}
            />
          </div>

          {/* RSVP Member Selection */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label><Users className="mr-1 inline h-3.5 w-3.5" />Invite Members (RSVP)</Label>
              <MemberMultiSelect
                members={members}
                selectedIds={rsvpMemberIds}
                onChange={setRsvpMemberIds}
                existingRsvps={activity?.rsvps}
              />
            </div>
          )}

          {/* Collapsible: Links/Reservations */}
          <SectionToggle label="Links & Reservations" icon={Link2} open={showLinks} onToggle={() => setShowLinks(!showLinks)} />
          {showLinks && (
            <div className="space-y-3 pl-2">
              <div className="space-y-2">
                <Label htmlFor="act-url">Reservation URL</Label>
                <Input
                  id="act-url"
                  placeholder="https://..."
                  value={form.reservationUrl}
                  onChange={(e) => set("reservationUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-code">Confirmation Code</Label>
                <Input
                  id="act-code"
                  placeholder="e.g., ABC123"
                  value={form.confirmationCode}
                  onChange={(e) => set("confirmationCode", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Collapsible: Cost */}
          <SectionToggle label="Cost" icon={DollarSign} open={showCost} onToggle={() => setShowCost(!showCost)} />
          {showCost && (
            <div className="grid gap-4 pl-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="act-cost">Amount ($)</Label>
                <Input
                  id="act-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-paidby">Paid By</Label>
                <Input
                  id="act-paidby"
                  placeholder="e.g., John"
                  value={form.paidBy}
                  onChange={(e) => set("paidBy", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Collapsible: Cross-System Links */}
          {(meals.length > 0 || wineEvents.length > 0) && (
            <>
              <SectionToggle label="Link to Meal/Wine Event" icon={Utensils} open={showCrossLinks} onToggle={() => setShowCrossLinks(!showCrossLinks)} />
              {showCrossLinks && (
                <div className="space-y-3 pl-2">
                  {meals.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="act-meal"><Utensils className="mr-1 inline h-3.5 w-3.5" />Linked Meal</Label>
                      <Select
                        id="act-meal"
                        options={mealOptions}
                        value={form.linkedMealId}
                        onChange={(e) => set("linkedMealId", e.target.value)}
                      />
                    </div>
                  )}
                  {wineEvents.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="act-wine"><Wine className="mr-1 inline h-3.5 w-3.5" />Linked Wine Event</Label>
                      <Select
                        id="act-wine"
                        options={wineEventOptions}
                        value={form.linkedWineEventId}
                        onChange={(e) => set("linkedWineEventId", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!form.title.trim()}
            className="gap-2"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
