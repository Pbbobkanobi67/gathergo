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

// --- Bag Assignment ---

interface AssignBagsInput {
  tripId: string;
  eventId: string;
  assignments: { entryId: string; bagNumber: number }[];
}

async function assignBags(input: AssignBagsInput) {
  const { tripId, eventId, assignments } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/assign-bags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignments }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to assign bags");
  }
  return (await res.json()).data;
}

// --- Reveal Winners ---

interface RevealWinnersInput {
  tripId: string;
  eventId: string;
}

async function revealWinners(input: RevealWinnersInput) {
  const { tripId, eventId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to reveal winners");
  }
  return (await res.json()).data;
}

// --- Wine Entry Update ---

interface UpdateEntryInput {
  tripId: string;
  eventId: string;
  entryId: string;
  data: {
    wineName?: string;
    winery?: string;
    vintage?: number;
    varietal?: string;
    price?: number;
    notes?: string;
    imageUrl?: string;
    bagNumber?: number | null;
  };
}

async function updateEntry(input: UpdateEntryInput) {
  const { tripId, eventId, entryId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update entry");
  }
  return (await res.json()).data;
}

// --- Wine Entry Delete ---

interface DeleteEntryInput {
  tripId: string;
  eventId: string;
  entryId: string;
}

async function deleteEntry(input: DeleteEntryInput) {
  const { tripId, eventId, entryId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/wine-events/${eventId}/entries/${entryId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete entry");
  }
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

export function useUpdateWineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEntry,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}

export function useDeleteWineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEntry,
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

export function useAssignBags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignBags,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
    },
  });
}

export function useRevealWinners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revealWinners,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.tripId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["hoodBucks"] });
    },
  });
}
