"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Utensils,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { MealFormModal } from "@/components/meals/MealFormModal";
import { RecipeFormModal } from "@/components/meals/RecipeFormModal";
import { MealDaySection } from "@/components/meals/MealDaySection";
import { GroceryList } from "@/components/meals/GroceryList";
import { AddGroceryItemDialog } from "@/components/meals/AddGroceryItemDialog";
import { useMeals, useDeleteMeal, type MealNightWithDetails, type RecipeWithCreator } from "@/hooks/useMeals";
import { useMembers } from "@/hooks/useMembers";
import { useTrip } from "@/hooks/useTrip";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useSafeUser } from "@/components/shared/SafeClerkUser";
import { MEAL_STATUSES, MEAL_TYPES } from "@/constants";

// Meal type sort order for within a day
const MEAL_TYPE_ORDER: Record<string, number> = {
  BREAKFAST: 0,
  LUNCH: 1,
  DINNER: 2,
  SNACKS: 3,
};

function generateDateRange(start: string | Date, end: string | Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  // Normalize to UTC date only
  current.setUTCHours(12, 0, 0, 0);
  endDate.setUTCHours(12, 0, 0, 0);
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export default function MealsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: meals, isLoading: mealsLoading } = useMeals(tripId);
  const { data: members } = useMembers(tripId);
  const { data: trip } = useTrip(tripId);
  const { data: shoppingItems } = useShoppingItems(tripId);
  const deleteMeal = useDeleteMeal();
  const { user: clerkUser } = useSafeUser();

  const [activeTab, setActiveTab] = useState<"meals" | "grocery">("meals");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Modal states
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealNightWithDetails | null>(null);
  const [defaultMealDate, setDefaultMealDate] = useState<string>("");
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithCreator | null>(null);
  const [recipeMealId, setRecipeMealId] = useState<string>("");
  const [groceryDialogOpen, setGroceryDialogOpen] = useState(false);

  // Find current user's member ID
  const currentMemberId = useMemo(() => {
    if (!clerkUser || !members) return null;
    const found = members.find((m) => m.userId === clerkUser.id);
    return found?.id || null;
  }, [clerkUser, members]);

  // Member options for dropdowns
  const memberOptions = useMemo(
    () => (members || []).map((m) => ({
      id: m.id,
      label: m.user?.name || m.guestName || "Guest",
    })),
    [members]
  );

  // Meal options for grocery dialog
  const mealOptions = useMemo(
    () => (meals || []).map((m) => {
      const typeInfo = MEAL_TYPES.find((t) => t.value === m.mealType);
      return {
        id: m.id,
        label: `${typeInfo?.icon || ""} ${m.title || typeInfo?.label || m.mealType}`,
      };
    }),
    [meals]
  );

  // Generate all trip dates
  const tripDates = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    return generateDateRange(trip.startDate, trip.endDate);
  }, [trip?.startDate, trip?.endDate]);

  // Initialize expanded days once we have dates
  if (tripDates.length > 0 && !initialized) {
    setExpandedDays(new Set(tripDates));
    setInitialized(true);
  }

  // Group meals by date
  const mealsByDate = useMemo(() => {
    const map: Record<string, MealNightWithDetails[]> = {};
    (meals || []).forEach((meal) => {
      const dateKey = new Date(meal.date).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(meal);
    });
    // Sort each date's meals by type order
    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => (MEAL_TYPE_ORDER[a.mealType] ?? 9) - (MEAL_TYPE_ORDER[b.mealType] ?? 9));
    });
    return map;
  }, [meals]);

  if (mealsLoading) {
    return <LoadingPage message="Loading meals..." />;
  }

  // Stats
  const totalMeals = meals?.length || 0;
  const statCounts = MEAL_STATUSES.map((s) => ({
    ...s,
    count: meals?.filter((m) => m.status === s.value).length || 0,
  }));

  // Use tripDates if available, otherwise fall back to dates from meals
  const displayDates = tripDates.length > 0 ? tripDates : Object.keys(mealsByDate).sort();

  // Toggle functions
  const toggleDay = (date: string) => {
    const next = new Set(expandedDays);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpandedDays(next);
  };

  const expandAll = () => setExpandedDays(new Set(displayDates));
  const collapseAll = () => setExpandedDays(new Set());

  // Meal actions
  const handleAddMealForDay = (date: string) => {
    setEditingMeal(null);
    setDefaultMealDate(date);
    setMealModalOpen(true);
  };

  const handleEditMeal = (meal: MealNightWithDetails) => {
    setEditingMeal(meal);
    setDefaultMealDate("");
    setMealModalOpen(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    await deleteMeal.mutateAsync({ tripId, mealId });
  };

  // Recipe actions
  const handleAddRecipe = (mealId: string) => {
    setRecipeMealId(mealId);
    setEditingRecipe(null);
    setRecipeModalOpen(true);
  };

  const handleEditRecipe = (mealId: string, recipe: RecipeWithCreator) => {
    setRecipeMealId(mealId);
    setEditingRecipe(recipe);
    setRecipeModalOpen(true);
  };

  const groceryItemCount = shoppingItems?.length || 0;

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
            <h1 className="text-2xl font-bold text-slate-100">Meals & Grocery</h1>
            <p className="text-sm text-slate-400">
              {totalMeals} meal{totalMeals !== 1 ? "s" : ""} across {displayDates.length} day{displayDates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "meals" && (
            <Button onClick={() => { setEditingMeal(null); setDefaultMealDate(""); setMealModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          )}
          {activeTab === "grocery" && (
            <Button onClick={() => setGroceryDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
        <button
          onClick={() => setActiveTab("meals")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "meals"
              ? "bg-teal-500/20 text-teal-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Utensils className="h-4 w-4" />
          Meal Planning
        </button>
        <button
          onClick={() => setActiveTab("grocery")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "grocery"
              ? "bg-teal-500/20 text-teal-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Grocery List
          {groceryItemCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{groceryItemCount}</Badge>
          )}
        </button>
      </div>

      {/* MEAL PLANNING TAB */}
      {activeTab === "meals" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCounts.map((s) => (
              <div
                key={s.value}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center"
              >
                <p className="text-2xl font-bold text-slate-100">{s.count}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Expand/Collapse */}
          {displayDates.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          )}

          {/* Day Sections */}
          {displayDates.length > 0 ? (
            <div className="space-y-4">
              {displayDates.map((date, index) => (
                <MealDaySection
                  key={date}
                  dayNumber={index + 1}
                  date={date}
                  meals={mealsByDate[date] || []}
                  tripId={tripId}
                  members={memberOptions}
                  isExpanded={expandedDays.has(date)}
                  onToggle={() => toggleDay(date)}
                  onAddMeal={() => handleAddMealForDay(date)}
                  onEditMeal={handleEditMeal}
                  onDeleteMeal={handleDeleteMeal}
                  onAddRecipe={handleAddRecipe}
                  onEditRecipe={handleEditRecipe}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Utensils}
              title="No meals planned"
              description="Add your first meal to get started with meal planning."
              actionLabel="Add a Meal"
              onAction={() => { setEditingMeal(null); setDefaultMealDate(""); setMealModalOpen(true); }}
            />
          )}
        </>
      )}

      {/* GROCERY LIST TAB */}
      {activeTab === "grocery" && (
        <GroceryList
          items={shoppingItems || []}
          tripId={tripId}
          members={memberOptions}
          currentMemberId={currentMemberId}
        />
      )}

      {/* Modals */}
      <MealFormModal
        open={mealModalOpen}
        onOpenChange={(open) => {
          setMealModalOpen(open);
          if (!open) setEditingMeal(null);
        }}
        tripId={tripId}
        meal={editingMeal}
        members={memberOptions}
        defaultDate={defaultMealDate}
      />

      <RecipeFormModal
        open={recipeModalOpen}
        onOpenChange={(open) => {
          setRecipeModalOpen(open);
          if (!open) {
            setEditingRecipe(null);
            setRecipeMealId("");
          }
        }}
        tripId={tripId}
        mealId={recipeMealId}
        recipe={editingRecipe}
      />

      <AddGroceryItemDialog
        open={groceryDialogOpen}
        onOpenChange={setGroceryDialogOpen}
        tripId={tripId}
        meals={mealOptions}
        members={memberOptions}
      />
    </div>
  );
}
