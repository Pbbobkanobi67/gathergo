"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WineEventWithDetails } from "@/types";

const API_BASE = "/api/trips";

// --- Fetch functions ---

async function fetchWineEvents(tripId: string): Promise<WineEventWithDetails[]> {
  const res = await fetch(`${API_BASE}/${tripId}/wine-events`);
  if (!res.ok) throw new Error("Failed to fetch wine events");
  const json = await res.json();
  return json.data;
}

async function fetchWineEvent(tripId: string, eventId: string): Promise<WineEventWithDetails> {
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch wine event");
  const json = await res.json();
  return json.data;
}

async function createWineEvent(input: {
  tripId: string;
  title: string;
  date: Date | string;
  contestType?: string;
  entriesPerPerson?: number;
  instructions?: string | null;
  priceRangeMin?: number;
  priceRangeMax?: number;
  hoodBucksPotSize?: number;
  allowCashBets?: boolean;
}): Promise<WineEventWithDetails> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create wine event");
  }
  const json = await res.json();
  return json.data;
}

async function updateWineEvent(input: {
  tripId: string;
  eventId: string;
  data: Record<string, unknown>;
}): Promise<WineEventWithDetails> {
  const { tripId, eventId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update wine event");
  }
  const json = await res.json();
  return json.data;
}

async function deleteWineEvent(input: {
  tripId: string;
  eventId: string;
}): Promise<void> {
  const { tripId, eventId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete wine event");
  }
}

// --- Hooks ---

export function useWineEvents(tripId: string | undefined) {
  return useQuery({
    queryKey: ["wineEvents", tripId],
    queryFn: () => fetchWineEvents(tripId!),
    enabled: !!tripId,
  });
}

export function useWineEvent(tripId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ["wineEvent", tripId, eventId],
    queryFn: () => fetchWineEvent(tripId!, eventId!),
    enabled: !!tripId && !!eventId,
  });
}

export function useCreateWineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWineEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}

export function useUpdateWineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWineEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}

export function useDeleteWineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWineEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}
