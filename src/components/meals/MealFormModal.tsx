"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateMeal, useUpdateMeal, useDeleteMeal, type MealNightWithDetails } from "@/hooks/useMeals";
import { MEAL_TYPES, MEAL_STATUSES } from "@/constants";

interface MemberOption {
  id: string;
  label: string;
}

interface MealFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  meal?: MealNightWithDetails | null;
  members: MemberOption[];
  defaultDate?: string;
}

const defaultForm = {
  date: "",
  mealType: "DINNER" as string,
  title: "",
  description: "",
  servings: "",
  assignedToMemberId: "",
  assignedCoupleName: "",
  notes: "",
  status: "UNASSIGNED" as string,
};

export function MealFormModal({
  open,
  onOpenChange,
  tripId,
  meal,
  members,
  defaultDate,
}: MealFormModalProps) {
  const isEdit = !!meal;
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open && meal) {
      setForm({
        date: new Date(meal.date).toISOString().split("T")[0],
        mealType: meal.mealType,
        title: meal.title || "",
        description: meal.description || "",
        servings: meal.servings ? String(meal.servings) : "",
        assignedToMemberId: meal.assignedToMemberId || "",
        assignedCoupleName: meal.assignedCoupleName || "",
        notes: meal.notes || "",
        status: meal.status,
      });
    } else if (open) {
      setForm({ ...defaultForm, date: defaultDate || "" });
    }
  }, [open, meal, defaultDate]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.date) return;

    try {
      if (isEdit && meal) {
        await updateMeal.mutateAsync({
          tripId,
          mealId: meal.id,
          data: {
            date: form.date,
            mealType: form.mealType,
            title: form.title || undefined,
            description: form.description || undefined,
            servings: form.servings ? parseInt(form.servings) : undefined,
            assignedToMemberId: form.assignedToMemberId || null,
            assignedCoupleName: form.assignedCoupleName || undefined,
            notes: form.notes || undefined,
            status: form.status,
          },
        });
      } else {
        await createMeal.mutateAsync({
          tripId,
          date: form.date,
          mealType: form.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS",
          title: form.title || undefined,
          description: form.description || undefined,
          servings: form.servings ? parseInt(form.servings) : undefined,
          assignedToMemberId: form.assignedToMemberId || undefined,
          assignedCoupleName: form.assignedCoupleName || undefined,
          notes: form.notes || undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!meal) return;
    try {
      await deleteMeal.mutateAsync({ tripId, mealId: meal.id });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createMeal.isPending || updateMeal.isPending;

  const mealTypeOptions = MEAL_TYPES.map((t) => ({
    value: t.value,
    label: `${t.icon} ${t.label}`,
  }));

  const statusOptions = MEAL_STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const memberOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.label })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-teal-400" /> : <Plus className="h-5 w-5 text-teal-400" />}
            {isEdit ? "Edit Meal" : "Add Meal"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-date" required>Date</Label>
              <Input
                id="meal-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select
                id="meal-type"
                options={mealTypeOptions}
                value={form.mealType}
                onChange={(e) => set("mealType", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-title">Title</Label>
            <Input
              id="meal-title"
              placeholder="e.g., Taco Night"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-desc">Description</Label>
            <Textarea
              id="meal-desc"
              placeholder="What's on the menu?"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-servings">Servings</Label>
              <Input
                id="meal-servings"
                type="number"
                placeholder="e.g., 8"
                value={form.servings}
                onChange={(e) => set("servings", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-assigned">Assigned Cook</Label>
              <Select
                id="meal-assigned"
                options={memberOptions}
                value={form.assignedToMemberId}
                onChange={(e) => set("assignedToMemberId", e.target.value)}
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="meal-status">Status</Label>
              <Select
                id="meal-status"
                options={statusOptions}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="meal-notes">Notes</Label>
            <Textarea
              id="meal-notes"
              placeholder="Any extra notes..."
              rows={2}
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
              isLoading={deleteMeal.isPending}
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
            disabled={!form.date}
            className="gap-2"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
