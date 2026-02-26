"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Recipe, TripMember } from "@/generated/prisma";

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

interface CreateRecipeInput {
  tripId: string;
  mealId: string;
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  imageUrl?: string;
  sourceUrl?: string;
  ingredients?: Array<{ name: string; amount: string | number; unit: string; notes?: string }>;
  instructions?: Array<{ step: number; text: string; timerMinutes?: number }>;
}

interface UpdateRecipeInput {
  tripId: string;
  mealId: string;
  recipeId: string;
  data: Record<string, unknown>;
}

interface DeleteRecipeInput {
  tripId: string;
  mealId: string;
  recipeId: string;
}

async function fetchRecipes(tripId: string, mealId: string): Promise<RecipeWithCreator[]> {
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}/recipes`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  const json = await res.json();
  return json.data;
}

async function createRecipe(input: CreateRecipeInput): Promise<RecipeWithCreator> {
  const { tripId, mealId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create recipe");
  }
  const json = await res.json();
  return json.data;
}

async function updateRecipe(input: UpdateRecipeInput): Promise<RecipeWithCreator> {
  const { tripId, mealId, recipeId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}/recipes/${recipeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update recipe");
  }
  const json = await res.json();
  return json.data;
}

async function deleteRecipe(input: DeleteRecipeInput): Promise<void> {
  const { tripId, mealId, recipeId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/meals/${mealId}/recipes/${recipeId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete recipe");
  }
}

export function useRecipes(tripId: string | undefined, mealId: string | undefined) {
  return useQuery({
    queryKey: ["recipes", tripId, mealId],
    queryFn: () => fetchRecipes(tripId!, mealId!),
    enabled: !!tripId && !!mealId,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.tripId, variables.mealId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.tripId, variables.mealId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.tripId, variables.mealId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export type { RecipeWithCreator, CreateRecipeInput, UpdateRecipeInput, DeleteRecipeInput };
