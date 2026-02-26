"use client";

import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MealCard } from "@/components/meals/MealCard";
import type { MealNightWithDetails, RecipeWithCreator } from "@/hooks/useMeals";
import { formatDate } from "@/lib/utils";

interface MemberOption {
  id: string;
  label: string;
}

interface MealDaySectionProps {
  dayNumber: number;
  date: string;
  meals: MealNightWithDetails[];
  tripId: string;
  members: MemberOption[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddMeal: () => void;
  onEditMeal: (meal: MealNightWithDetails) => void;
  onDeleteMeal: (mealId: string) => void;
  onAddRecipe: (mealId: string) => void;
  onEditRecipe: (mealId: string, recipe: RecipeWithCreator) => void;
}

export function MealDaySection({
  dayNumber,
  date,
  meals,
  tripId,
  members,
  isExpanded,
  onToggle,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onAddRecipe,
  onEditRecipe,
}: MealDaySectionProps) {
  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-sm font-bold text-teal-400">
            D{dayNumber}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Day {dayNumber}</h3>
            <p className="text-sm text-slate-400">{formatDate(date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meals.length > 0 && (
            <Badge variant="secondary">
              {meals.length} meal{meals.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <CardContent className="border-t border-slate-700 pt-4">
          {meals.length > 0 ? (
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  tripId={tripId}
                  members={members}
                  onEdit={() => onEditMeal(meal)}
                  onDelete={() => onDeleteMeal(meal.id)}
                  onAddRecipe={() => onAddRecipe(meal.id)}
                  onEditRecipe={(recipe) => onEditRecipe(meal.id, recipe)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">No meals yet</p>
          )}

          <Button
            variant="ghost"
            className="mt-3 w-full gap-2 border border-dashed border-slate-700 text-slate-400 hover:text-teal-400"
            onClick={onAddMeal}
          >
            <Plus className="h-4 w-4" />
            Add Meal for this day
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
