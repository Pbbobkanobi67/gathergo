"use client";

import { Pencil, Trash2, Plus, Check, ChefHat, Clock, Users, ShoppingCart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import type { MealNightWithDetails, RecipeWithCreator } from "@/hooks/useMeals";
import { useUpdateMeal } from "@/hooks/useMeals";
import { MEAL_TYPES, MEAL_STATUSES, RECIPE_DIFFICULTIES } from "@/constants";

interface MemberOption {
  id: string;
  label: string;
}

interface MealCardProps {
  meal: MealNightWithDetails;
  tripId: string;
  members: MemberOption[];
  onEdit: () => void;
  onDelete: () => void;
  onAddRecipe: () => void;
  onEditRecipe: (recipe: RecipeWithCreator) => void;
}

export function MealCard({
  meal,
  tripId,
  members,
  onEdit,
  onDelete,
  onAddRecipe,
  onEditRecipe,
}: MealCardProps) {
  const updateMeal = useUpdateMeal();

  const typeInfo = MEAL_TYPES.find((t) => t.value === meal.mealType) || MEAL_TYPES[2];
  const statusInfo = MEAL_STATUSES.find((s) => s.value === meal.status) || MEAL_STATUSES[0];
  const assignedName = meal.assignedTo?.user?.name || meal.assignedTo?.guestName || null;

  const handleAssign = async (memberId: string) => {
    await updateMeal.mutateAsync({
      tripId,
      mealId: meal.id,
      data: {
        assignedToMemberId: memberId || null,
        status: memberId ? "ASSIGNED" : "UNASSIGNED",
      },
    });
  };

  const handleComplete = async () => {
    await updateMeal.mutateAsync({
      tripId,
      mealId: meal.id,
      data: { status: "COMPLETED" },
    });
  };

  const memberOptions = members.map((m) => ({ value: m.id, label: m.label }));
  const groceryCount = meal.shoppingItems?.length || 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeInfo.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-100">
              {meal.title || typeInfo.label}
            </h4>
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
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                className="h-8 w-48 text-xs"
              />
            )}

            {meal.servings && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="h-3 w-3" />
                {meal.servings} servings
              </span>
            )}

            {meal.recipes.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ChefHat className="h-3 w-3" />
                {meal.recipes.length} recipe{meal.recipes.length !== 1 ? "s" : ""}
              </span>
            )}

            {groceryCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ShoppingCart className="h-3 w-3" />
                {groceryCount} item{groceryCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Recipe List */}
          {meal.recipes.length > 0 && (
            <div className="mt-3 space-y-2">
              {meal.recipes.map((recipe) => {
                const diffInfo = RECIPE_DIFFICULTIES.find((d) => d.value === recipe.difficulty);
                const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => onEditRecipe(recipe)}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-left text-sm transition-colors hover:border-slate-600"
                  >
                    <ChefHat className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="flex-1 text-slate-200">{recipe.title}</span>
                    {diffInfo && (
                      <span className={`text-xs ${diffInfo.color}`}>{diffInfo.label}</span>
                    )}
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {totalTime}m
                      </span>
                    )}
                    {recipe.sourceUrl && (
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onAddRecipe} title="Add recipe">
            <ChefHat className="h-4 w-4 text-amber-400" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit meal">
            <Pencil className="h-4 w-4 text-slate-400" />
          </Button>
          {meal.status !== "COMPLETED" && (
            <Button variant="ghost" size="icon-sm" onClick={handleComplete} title="Mark complete">
              <Check className="h-4 w-4 text-green-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Delete meal"
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
