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
import { useSubmitWineEntry, useUpdateWineEntry, useDeleteWineEntry } from "@/hooks/useWineEventDetail";
import type { WineEntryWithSubmitter } from "@/types";

interface WineEntryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  eventId: string;
  entry?: WineEntryWithSubmitter | null;
}

const defaultForm = {
  wineName: "",
  winery: "",
  vintage: "",
  varietal: "",
  price: "",
  notes: "",
};

export function WineEntryFormModal({ open, onOpenChange, tripId, eventId, entry }: WineEntryFormModalProps) {
  const isEdit = !!entry;
  const submitEntry = useSubmitWineEntry();
  const updateEntry = useUpdateWineEntry();
  const deleteEntry = useDeleteWineEntry();

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open && entry) {
      setForm({
        wineName: entry.wineName,
        winery: entry.winery || "",
        vintage: entry.vintage ? String(entry.vintage) : "",
        varietal: entry.varietal || "",
        price: String(entry.price),
        notes: entry.notes || "",
      });
    } else if (open) {
      setForm(defaultForm);
    }
  }, [open, entry]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.wineName.trim() || !form.price) return;
    try {
      if (isEdit && entry) {
        await updateEntry.mutateAsync({
          tripId,
          eventId,
          entryId: entry.id,
          data: {
            wineName: form.wineName,
            winery: form.winery || undefined,
            vintage: form.vintage ? parseInt(form.vintage) : undefined,
            varietal: form.varietal || undefined,
            price: parseFloat(form.price),
            notes: form.notes || undefined,
          },
        });
      } else {
        await submitEntry.mutateAsync({
          tripId,
          eventId,
          wineName: form.wineName,
          winery: form.winery || undefined,
          vintage: form.vintage ? parseInt(form.vintage) : undefined,
          varietal: form.varietal || undefined,
          price: parseFloat(form.price),
          notes: form.notes || undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteEntry.mutateAsync({ tripId, eventId, entryId: entry.id });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = submitEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-purple-400" /> : <Wine className="h-5 w-5 text-purple-400" />}
            {isEdit ? "Edit Wine Entry" : "Add Wine Entry"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this wine entry." : "Submit your wine. It will be assigned the next bag number."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wine-name" required>Wine Name</Label>
            <Input
              id="wine-name"
              placeholder="e.g., 2019 Caymus Cabernet"
              value={form.wineName}
              onChange={(e) => set("wineName", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry-winery">Winery</Label>
              <Input
                id="entry-winery"
                placeholder="e.g., Caymus Vineyards"
                value={form.winery}
                onChange={(e) => set("winery", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-varietal">Varietal</Label>
              <Input
                id="entry-varietal"
                placeholder="e.g., Cabernet Sauvignon"
                value={form.varietal}
                onChange={(e) => set("varietal", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry-vintage">Vintage Year</Label>
              <Input
                id="entry-vintage"
                type="number"
                placeholder="e.g., 2019"
                value={form.vintage}
                onChange={(e) => set("vintage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-price" required>Price ($)</Label>
              <Input
                id="entry-price"
                type="number"
                step="0.01"
                placeholder="e.g., 24.99"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-notes">Notes</Label>
            <Input
              id="entry-notes"
              placeholder="Tasting notes, pairing suggestions..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteEntry.isPending}
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
            disabled={!form.wineName.trim() || !form.price}
            className="gap-2"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Submit Wine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
