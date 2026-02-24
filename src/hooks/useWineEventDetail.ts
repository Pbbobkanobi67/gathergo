"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

// --- Wine Entry ---

interface SubmitEntryInput {
  tripId: string;
  eventId: string;
  wineName: string;
  winery?: string;
  vintage?: number;
  varietal?: string;
  price: number;
  imageUrl?: string;
  notes?: string;
}

async function submitEntry(input: SubmitEntryInput) {
  const { tripId, eventId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to submit entry");
  }
  return (await res.json()).data;
}

// --- Wine Score ---

interface SubmitScoreInput {
  tripId: string;
  eventId: string;
  rankings: { first: string; second: string; third: string };
  tasteNotes: Record<string, { rating: number; notes?: string }>;
}

async function submitScore(input: SubmitScoreInput) {
  const { tripId, eventId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to submit score");
  }
  return (await res.json()).data;
}

// --- Wine Bet ---

interface PlaceBetInput {
  tripId: string;
  eventId: string;
  predictedFirst: string;
  predictedSecond: string;
  predictedThird: string;
  betAmountHoodBucks: number;
  betAmountCash: number;
}

async function placeBet(input: PlaceBetInput) {
  const { tripId, eventId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/bets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to place bet");
  }
  return (await res.json()).data;
}

// --- Activity Vote ---

async function voteActivity(input: { tripId: string; activityId: string; vote?: string }) {
  const { tripId, activityId, vote } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities/${activityId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vote: vote || "UP" }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to vote");
  }
  return (await res.json()).data;
}

// --- Hooks ---

export function useSubmitWineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitEntry,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}

export function useSubmitWineScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitScore,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
    },
  });
}

export function usePlaceWineBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeBet,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["hoodBucks"] });
    },
  });
}

export function useVoteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voteActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}
