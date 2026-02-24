"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WineEventWithDetails } from "@/types";
import type { WineEntryCreateInput, WineScoreCreateInput, WineBetCreateInput } from "@/lib/validations";

const API_BASE = "/api/wine/events";

async function fetchWineEvents(tripId: string): Promise<WineEventWithDetails[]> {
  const res = await fetch(`${API_BASE}?tripId=${tripId}`);
  if (!res.ok) throw new Error("Failed to fetch wine events");
  const data = await res.json();
  return data.data;
}

async function fetchWineEvent(eventId: string): Promise<WineEventWithDetails> {
  const res = await fetch(`${API_BASE}/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch wine event");
  const data = await res.json();
  return data.data;
}

async function createWineEvent(input: {
  tripId: string;
  title: string;
  date: Date;
  priceRangeMin?: number;
  priceRangeMax?: number;
  hoodBucksPotSize?: number;
  allowCashBets?: boolean;
}): Promise<WineEventWithDetails> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create wine event");
  const data = await res.json();
  return data.data;
}

async function updateWineEventStatus(eventId: string, status: string): Promise<WineEventWithDetails> {
  const res = await fetch(`${API_BASE}/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update wine event status");
  const data = await res.json();
  return data.data;
}

async function submitWineEntry(input: WineEntryCreateInput): Promise<void> {
  const res = await fetch(`${API_BASE}/${input.wineEventId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to submit wine entry");
}

async function submitWineScore(input: WineScoreCreateInput): Promise<void> {
  const res = await fetch(`${API_BASE}/${input.wineEventId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to submit wine score");
}

async function submitWineBet(input: WineBetCreateInput): Promise<void> {
  const res = await fetch(`${API_BASE}/${input.wineEventId}/bets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to submit wine bet");
}

async function triggerReveal(eventId: string): Promise<WineEventWithDetails> {
  const res = await fetch(`${API_BASE}/${eventId}/reveal`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger reveal");
  const data = await res.json();
  return data.data;
}

export function useWineEvents(tripId: string | undefined) {
  return useQuery({
    queryKey: ["wineEvents", tripId],
    queryFn: () => fetchWineEvents(tripId!),
    enabled: !!tripId,
  });
}

export function useWineEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["wineEvent", eventId],
    queryFn: () => fetchWineEvent(eventId!),
    enabled: !!eventId,
    refetchInterval: (query) => {
      const event = query.state.data;
      // Poll more frequently during scoring phase
      if (event?.status === "SCORING") return 5000;
      if (event?.status === "REVEAL") return 2000;
      return false;
    },
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

export function useUpdateWineEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      updateWineEventStatus(eventId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", data.id] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents"] });
    },
  });
}

export function useSubmitWineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitWineEntry,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.wineEventId] });
    },
  });
}

export function useSubmitWineScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitWineScore,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.wineEventId] });
    },
  });
}

export function useSubmitWineBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitWineBet,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", variables.wineEventId] });
      queryClient.invalidateQueries({ queryKey: ["hoodBucks"] });
    },
  });
}

export function useTriggerReveal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerReveal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wineEvent", data.id] });
      queryClient.invalidateQueries({ queryKey: ["wineEvents"] });
      queryClient.invalidateQueries({ queryKey: ["hoodBucks"] });
    },
  });
}
