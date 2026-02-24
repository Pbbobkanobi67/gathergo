"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Trip, TripWithDetails, TripFormData } from "@/types";

const API_BASE = "/api";

async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE}/trips`);
  if (!res.ok) throw new Error("Failed to fetch trips");
  const data = await res.json();
  return data.data;
}

async function fetchTrip(tripId: string): Promise<TripWithDetails> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`);
  if (!res.ok) throw new Error("Failed to fetch trip");
  const data = await res.json();
  return data.data;
}

async function createTrip(input: TripFormData): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create trip");
  const data = await res.json();
  return data.data;
}

async function updateTrip(tripId: string, input: Partial<TripFormData>): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update trip");
  const data = await res.json();
  return data.data;
}

async function deleteTrip(tripId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete trip");
}

async function regenerateInviteLink(tripId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/invite`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to regenerate invite link");
  const data = await res.json();
  return data.data.inviteToken;
}

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: Partial<TripFormData> }) =>
      updateTrip(tripId, data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useRegenerateInviteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateInviteLink,
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}
