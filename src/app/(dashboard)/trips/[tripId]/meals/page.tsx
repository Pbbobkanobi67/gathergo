"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Utensils,
  ChefHat,
  Clock,
  Users,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMeals, useCreateMeal, useUpdateMeal } from "@/hooks/useMeals";
import { useMembers } from "@/hooks/useMembers";
import { formatDate } from "@/lib/utils";
import { MEAL_TYPES, MEAL_STATUSES } from "@/constants";

export default function MealsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: meals, isLoading } = useMeals(tripId);
  const { data: members } = useMembers(tripId);
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    date: "",
    mealType: "DINNER" as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS",
    title: "",
    description: "",
    servings: "",
  });

  if (isLoading) {
    return <LoadingPage message="Loading meals..." />;
  }

  const handleAddMeal = async () => {
    if (!newMeal.date) return;
    try {
      await createMeal.mutateAsync({
        tripId,
        date: newMeal.date,
        mealType: newMeal.mealType,
        title: newMeal.title || undefined,
        description: newMeal.description || undefined,
        servings: newMeal.servings ? parseInt(newMeal.servings) : undefined,
      });
      setNewMeal({ date: "", mealType: "DINNER", title: "", description: "", servings: "" });
      setAddMealOpen(false);
    } catch {
      // Error on createMeal.error
    }
  };

  const handleAssign = async (mealId: string, memberId: string) => {
    await updateMeal.mutateAsync({
      tripId,
      mealId,
      data: {
        assignedToMemberId: memberId,
        status: "ASSIGNED",
      },
    });
  };

  const handleStatusChange = async (mealId: string, status: string) => {
    await updateMeal.mutateAsync({
      tripId,
      mealId,
      data: { status },
    });
  };

  const getMealTypeInfo = (type: string) =>
    MEAL_TYPES.find((t) => t.value === type) || MEAL_TYPES[2];

  const getStatusInfo = (status: string) =>
    MEAL_STATUSES.find((s) => s.value === status) || MEAL_STATUSES[0];

  const mealTypeOptions = MEAL_TYPES.map((t) => ({
    value: t.value,
    label: `${t.icon} ${t.label}`,
  }));

  const memberOptions = (members || []).map((m) => ({
    value: m.id,
    label: m.user?.name || m.guestName || "Guest",
  }));

  // Group meals by date
  type MealList = NonNullable<typeof meals>;
  const mealsByDate = (meals || []).reduce((acc: Record<string, MealList>, meal) => {
    const dateKey = new Date(meal.date).toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(meal);
    return acc;
  }, {} as Record<string, MealList>);

  const sortedDates = Object.keys(mealsByDate).sort();

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
            <h1 className="text-2xl font-bold text-slate-100">Meal Planning</h1>
            <p className="text-sm text-slate-400">
              {meals?.length || 0} meals across {sortedDates.length} days
            </p>
          </div>
        </div>
        <Button onClick={() => setAddMealOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Meal
        </Button>
      </div>

      {/* Meal Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MEAL_STATUSES.map((status) => {
          const count = meals?.filter((m) => m.status === status.value).length || 0;
          return (
            <div
              key={status.value}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center"
            >
              <p className="text-2xl font-bold text-slate-100">{count}</p>
              <p className="text-xs text-slate-400">{status.label}</p>
            </div>
          );
        })}
      </div>

      {/* Meals by Date */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateMeals = mealsByDate[dateKey] || [];
            return (
              <div key={dateKey}>
                <h2 className="mb-3 text-lg font-semibold text-slate-200">
                  {formatDate(dateKey)}
                </h2>
                <div className="space-y-3">
                  {dateMeals.map((meal) => {
                    const typeInfo = getMealTypeInfo(meal.mealType);
                    const statusInfo = getStatusInfo(meal.status);
                    const assignedName = meal.assignedTo?.user?.name || meal.assignedTo?.guestName || null;

                    return (
                      <Card key={meal.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <span className="text-2xl">{typeInfo.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-100">
                                  {meal.title || typeInfo.label}
                                </h3>
                                <Badge
                                  variant={
                                    meal.status === "COMPLETED"
                                      ? "success"
                                      : meal.status === "PLANNED"
                                      ? "default"
                                      : meal.status === "ASSIGNED"
                                      ? "warning"
                                      : "secondary"
                                  }
                                >
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              {meal.description && (
                                <p className="mt-1 text-sm text-slate-400">{meal.description}</p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                {/* Assignment */}
                                {assignedName ? (
                                  <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
                                    <UserAvatar
                                      name={assignedName}
                                      src={meal.assignedTo?.user?.avatarUrl}
                                      size="sm"
                                    />
                                    <span className="text-sm text-slate-200">{assignedName}</span>
                                  </div>
                                ) : (
                                  <Select
                                    placeholder="Assign cook..."
                                    options={memberOptions}
                                    onChange={(e) => e.target.value && handleAssign(meal.id, e.target.value)}
                                    className="h-8 w-48 text-xs"
                                  />
                                )}

                                {meal.servings && (
                                  <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Users className="h-3 w-3" />
                                    {meal.servings} servings
                                  </span>
                                )}

                                {/* Recipes */}
                                {meal.recipes && meal.recipes.length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <ChefHat className="h-3 w-3" />
                                    {meal.recipes.length} recipe{meal.recipes.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>

                              {/* Recipe List */}
                              {meal.recipes && meal.recipes.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {meal.recipes.map((recipe) => (
                                    <div
                                      key={recipe.id}
                                      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm"
                                    >
                                      <ChefHat className="h-4 w-4 text-amber-400" />
                                      <span className="text-slate-200">{recipe.title}</span>
                                      {recipe.prepTimeMinutes && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                          <Clock className="h-3 w-3" />
                                          {recipe.prepTimeMinutes + (recipe.cookTimeMinutes || 0)}m
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 gap-1">
                              {meal.status !== "COMPLETED" && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleStatusChange(meal.id, "COMPLETED")}
                                  title="Mark complete"
                                >
                                  <Check className="h-4 w-4 text-green-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Utensils}
          title="No meals planned"
          description="Meals are auto-created with your trip. Add custom meals for breakfasts, lunches, or snacks."
          actionLabel="Add a Meal"
          onAction={() => setAddMealOpen(true)}
        />
      )}

      {/* Add Meal Dialog */}
      <Dialog open={addMealOpen} onOpenChange={setAddMealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-teal-400" />
              Add Meal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meal-date" required>Date</Label>
                <Input
                  id="meal-date"
                  type="date"
                  value={newMeal.date}
                  onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-type">Meal Type</Label>
                <Select
                  id="meal-type"
                  options={mealTypeOptions}
                  value={newMeal.mealType}
                  onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value as typeof newMeal.mealType })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-title">Title (optional)</Label>
              <Input
                id="meal-title"
                placeholder="e.g., Taco Night"
                value={newMeal.title}
                onChange={(e) => setNewMeal({ ...newMeal, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-desc">Description</Label>
              <Textarea
                id="meal-desc"
                placeholder="What's on the menu?"
                rows={2}
                value={newMeal.description}
                onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-servings">Servings</Label>
              <Input
                id="meal-servings"
                type="number"
                placeholder="e.g., 8"
                value={newMeal.servings}
                onChange={(e) => setNewMeal({ ...newMeal, servings: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMealOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMeal}
              isLoading={createMeal.isPending}
              disabled={!newMeal.date}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
