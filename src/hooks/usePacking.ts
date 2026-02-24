"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

// --- Types ---

interface MemberInfo {
  id: string;
  guestName: string | null;
  role: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface PackingItem {
  id: string;
  tripId: string;
  category: string;
  name: string;
  quantity: number;
  forEveryone: boolean;
  claimedByMemberId: string | null;
  claimedBy: MemberInfo | null;
  isPacked: boolean;
  notes: string | null;
  createdAt: string;
}

interface CreatePackingItemInput {
  tripId: string;
  category?: string;
  name: string;
  quantity?: number;
  forEveryone?: boolean;
  notes?: string;
}

interface UpdatePackingItemInput {
  tripId: string;
  itemId: string;
  data: Partial<{
    category: string;
    name: string;
    quantity: number;
    forEveryone: boolean;
    notes: string;
    claimedByMemberId: string | null;
    isPacked: boolean;
  }>;
}

interface DeletePackingItemInput {
  tripId: string;
  itemId: string;
}

// --- API functions ---

async function fetchPackingItems(tripId: string): Promise<PackingItem[]> {
  const res = await fetch(`${API_BASE}/${tripId}/packing`);
  if (!res.ok) throw new Error("Failed to fetch packing items");
  const json = await res.json();
  return json.data;
}

async function createPackingItem(input: CreatePackingItemInput): Promise<PackingItem> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/packing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create packing item");
  }
  const json = await res.json();
  return json.data;
}

async function updatePackingItem(input: UpdatePackingItemInput): Promise<PackingItem> {
  const { tripId, itemId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/packing/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update packing item");
  }
  const json = await res.json();
  return json.data;
}

async function deletePackingItem(input: DeletePackingItemInput): Promise<void> {
  const { tripId, itemId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/packing/${itemId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete packing item");
  }
}

// --- Hooks ---

export function usePackingItems(tripId: string | undefined) {
  return useQuery({
    queryKey: ["packing", tripId],
    queryFn: () => fetchPackingItems(tripId!),
    enabled: !!tripId,
  });
}

export function useCreatePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPackingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packing", variables.tripId] });
    },
  });
}

export function useUpdatePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePackingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packing", variables.tripId] });
    },
  });
}

export function useDeletePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePackingItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packing", variables.tripId] });
    },
  });
}

export type { PackingItem, CreatePackingItemInput, UpdatePackingItemInput, DeletePackingItemInput, MemberInfo };
