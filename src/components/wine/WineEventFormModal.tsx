"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateWineEvent, useUpdateWineEvent, useDeleteWineEvent } from "@/hooks/useWineEvents";
import type { WineEventWithDetails } from "@/types";

interface WineEventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  event?: WineEventWithDetails | null;
}

const defaultForm = {
  title: "",
  date: "",
  priceRangeMin: "4",
  priceRangeMax: "40",
  hoodBucksPotSize: "500",
  allowCashBets: true,
};

export function WineEventFormModal({ open, onOpenChange, tripId, event }: WineEventFormModalProps) {
  const isEdit = !!event;
  const createEvent = useCreateWineEvent();
  const updateEvent = useUpdateWineEvent();
  const deleteEvent = useDeleteWineEvent();

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open && event) {
      setForm({
        title: event.title,
        date: new Date(event.date).toISOString().split("T")[0],
        priceRangeMin: String(event.priceRangeMin),
        priceRangeMax: String(event.priceRangeMax),
        hoodBucksPotSize: String(event.hoodBucksPotSize),
        allowCashBets: event.allowCashBets,
      });
    } else if (open) {
      setForm(defaultForm);
    }
  }, [open, event]);

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) return;
    try {
      if (isEdit && event) {
        await updateEvent.mutateAsync({
          tripId,
          eventId: event.id,
          data: {
            title: form.title,
            date: form.date,
            priceRangeMin: parseFloat(form.priceRangeMin) || 4,
            priceRangeMax: parseFloat(form.priceRangeMax) || 40,
            hoodBucksPotSize: parseInt(form.hoodBucksPotSize) || 500,
            allowCashBets: form.allowCashBets,
          },
        });
      } else {
        await createEvent.mutateAsync({
          tripId,
          title: form.title,
          date: form.date,
          priceRangeMin: parseFloat(form.priceRangeMin) || 4,
          priceRangeMax: parseFloat(form.priceRangeMax) || 40,
          hoodBucksPotSize: parseInt(form.hoodBucksPotSize) || 500,
          allowCashBets: form.allowCashBets,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteEvent.mutateAsync({ tripId, eventId: event.id });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-purple-400" /> : <Wine className="h-5 w-5 text-purple-400" />}
            {isEdit ? "Edit Wine Event" : "New Wine Event"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the wine tasting event details." : "Set up a blind wine tasting competition."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wine-title" required>Event Name</Label>
            <Input
              id="wine-title"
              placeholder="e.g., Friday Night Wine Off"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wine-date" required>Date</Label>
            <Input
              id="wine-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wine-min">Min Price ($)</Label>
              <Input
                id="wine-min"
                type="number"
                value={form.priceRangeMin}
                onChange={(e) => set("priceRangeMin", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wine-max">Max Price ($)</Label>
              <Input
                id="wine-max"
                type="number"
                value={form.priceRangeMax}
                onChange={(e) => set("priceRangeMax", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wine-pot">Hood Bucks Prize Pool</Label>
            <Input
              id="wine-pot"
              type="number"
              value={form.hoodBucksPotSize}
              onChange={(e) => set("hoodBucksPotSize", e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.allowCashBets}
              onChange={(e) => set("allowCashBets", e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-200">Allow cash side bets</span>
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteEvent.isPending}
              className="gap-2 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!form.title.trim() || !form.date}
            className="gap-2"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
