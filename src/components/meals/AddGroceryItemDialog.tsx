"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { useCreateShoppingItem } from "@/hooks/useShoppingItems";
import { SHOPPING_CATEGORIES } from "@/constants";

interface MealOption {
  id: string;
  label: string;
}

interface MemberOption {
  id: string;
  label: string;
}

interface AddGroceryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  meals: MealOption[];
  members: MemberOption[];
}

export function AddGroceryItemDialog({
  open,
  onOpenChange,
  tripId,
  meals,
  members,
}: AddGroceryItemDialogProps) {
  const createItem = useCreateShoppingItem();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [mealNightId, setMealNightId] = useState("");
  const [assignedToMemberId, setAssignedToMemberId] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await createItem.mutateAsync({
        tripId,
        name: name.trim(),
        quantity: quantity ? parseFloat(quantity) : 1,
        unit: unit || undefined,
        category,
        mealNightId: mealNightId || undefined,
        assignedToMemberId: assignedToMemberId || undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes: notes || undefined,
      });
      // Reset form
      setName("");
      setQuantity("1");
      setUnit("");
      setCategory("OTHER");
      setMealNightId("");
      setAssignedToMemberId("");
      setEstimatedCost("");
      setNotes("");
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const categoryOptions = SHOPPING_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  const mealOptions = [
    { value: "", label: "None (standalone)" },
    ...meals.map((m) => ({ value: m.id, label: m.label })),
  ];

  const memberOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.label })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-400" />
            Add Grocery Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grocery-name" required>Item Name</Label>
            <Input
              id="grocery-name"
              placeholder="e.g., Chicken breast"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="grocery-qty">Quantity</Label>
              <Input
                id="grocery-qty"
                type="number"
                min="0"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grocery-unit">Unit</Label>
              <Input
                id="grocery-unit"
                placeholder="lbs, oz, etc."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grocery-cost">Est. Cost</Label>
              <Input
                id="grocery-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="$0.00"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grocery-category">Category</Label>
            <Select
              id="grocery-category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grocery-meal">Linked Meal</Label>
              <Select
                id="grocery-meal"
                options={mealOptions}
                value={mealNightId}
                onChange={(e) => setMealNightId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grocery-assigned">Assigned To</Label>
              <Select
                id="grocery-assigned"
                options={memberOptions}
                value={assignedToMemberId}
                onChange={(e) => setAssignedToMemberId(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grocery-notes">Notes</Label>
            <Textarea
              id="grocery-notes"
              placeholder="Brand preference, special instructions..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={createItem.isPending}
            disabled={!name.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
