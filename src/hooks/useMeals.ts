"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealNight, Recipe, TripMember } from "@/generated/prisma";

const API_BASE = "/api/trips";

interface MemberWithUser extends TripMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface RecipeWithCreator extends Recipe {
  createdBy: MemberWithUser | null;
}

interface MealNightWithDetails extends MealNight {
  recipes: RecipeWithCreator[];
  assignedTo: MemberWithUser | null;
}

interface CreateMealInput {
  tripId: string;
  date: Date | string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
  title?: string;
  description?: string;
  assignedToMemberId?: string;
  assignedCoupleName?: string;
  servings?: number;
  notes?: string;
}

interface UpdateMealInput {
  tripId: string;
  mealId: string;
  data: Record<string, unknown>;
}

interface DeleteMealInput {
  tripId: string;
  mealId: string;
}

async function fetchMeals(tripId: string): Promise<MealNightWithDetails[]> {
  const res = await fetch(`${API_BASE}/${tripId}/meals`);
  if (!res.ok) throw new Error("Failed to fetch meals");
  const json = await res.json();
  return json.data;
}

async function createMeal(input: CreateMealInput): Promise<MealNightWithDetails> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create meal");
  }
  const json = await res.json();
  return json.data;
}

async function updateMeal(input: UpdateMealInput): Promise<MealNightWithDetails> {
  const { tripId, mealId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update meal");
  }
  const json = await res.json();
  return json.data;
}

async function deleteMeal(input: DeleteMealInput): Promise<void> {
  const { tripId, mealId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete meal");
  }
}

export function useMeals(tripId: string | undefined) {
  return useQuery({
    queryKey: ["meals", tripId],
    queryFn: () => fetchMeals(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMeal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMeal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export type { MealNightWithDetails, RecipeWithCreator, CreateMealInput, UpdateMealInput, DeleteMealInput };
