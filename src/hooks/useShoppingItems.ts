"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShoppingItem, TripMember } from "@/generated/prisma";

const API_BASE = "/api/trips";

interface MemberWithUser extends TripMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface MealInfo {
  id: string;
  title: string | null;
  mealType: string;
  date: string | Date;
}

interface ShoppingItemWithDetails extends ShoppingItem {
  assignedTo: MemberWithUser | null;
  purchasedBy: MemberWithUser | null;
  mealNight: MealInfo | null;
}

interface CreateShoppingItemInput {
  tripId: string;
  mealNightId?: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  estimatedCost?: number;
  assignedToMemberId?: string;
  notes?: string;
}

interface UpdateShoppingItemInput {
  tripId: string;
  itemId: string;
  data: Partial<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    estimatedCost: number;
    assignedToMemberId: string | null;
    isPurchased: boolean;
    purchasedByMemberId: string | null;
    mealNightId: string | null;
    notes: string;
  }>;
}

interface DeleteShoppingItemInput {
  tripId: string;
  itemId: string;
}

async function fetchShoppingItems(tripId: string): Promise<ShoppingItemWithDetails[]> {
  const res = await fetch(`${API_BASE}/${tripId}/shopping`);
  if (!res.ok) throw new Error("Failed to fetch shopping items");
  const json = await res.json();
  return json.data;
}

async function createShoppingItem(input: CreateShoppingItemInput): Promise<ShoppingItemWithDetails> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/shopping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create shopping item");
  }
  const json = await res.json();
  return json.data;
}

async function updateShoppingItem(input: UpdateShoppingItemInput): Promise<ShoppingItemWithDetails> {
  const { tripId, itemId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/shopping/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update shopping item");
  }
  const json = await res.json();
  return json.data;
}

async function deleteShoppingItem(input: DeleteShoppingItemInput): Promise<void> {
  const { tripId, itemId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/shopping/${itemId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete shopping item");
  }
}

export function useShoppingItems(tripId: string | undefined) {
  return useQuery({
    queryKey: ["shopping", tripId],
    queryFn: () => fetchShoppingItems(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShoppingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shopping", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShoppingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shopping", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShoppingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shopping", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["meals", variables.tripId] });
    },
  });
}

export type { ShoppingItemWithDetails, CreateShoppingItemInput, UpdateShoppingItemInput, DeleteShoppingItemInput };
