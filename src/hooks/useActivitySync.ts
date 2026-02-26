"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

interface SyncInput {
  tripId: string;
}

async function syncActivities(input: SyncInput) {
  const res = await fetch(`${API_BASE}/${input.tripId}/activities/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to sync activities");
  }
  const json = await res.json();
  return json.data as { created: string[]; count: number };
}

export function useSyncActivities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncActivities,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}
