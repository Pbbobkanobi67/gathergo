"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HoodBucksBalance, HoodBucksTransaction } from "@/types";

const API_BASE = "/api/hood-bucks";

interface TransactionWithTrip extends HoodBucksTransaction {
  trip?: { title: string } | null;
}

async function fetchBalance(memberId: string): Promise<HoodBucksBalance> {
  const res = await fetch(`${API_BASE}/balance?memberId=${memberId}`);
  if (!res.ok) throw new Error("Failed to fetch balance");
  const data = await res.json();
  return data.data;
}

async function fetchTransactions(memberId: string, tripId?: string): Promise<TransactionWithTrip[]> {
  const params = new URLSearchParams({ memberId });
  if (tripId) params.append("tripId", tripId);

  const res = await fetch(`${API_BASE}/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const data = await res.json();
  return data.data;
}

async function grantBonus(input: {
  memberId: string;
  amount: number;
  description: string;
  tripId: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to grant bonus");
}

export function useHoodBucksBalance(memberId: string | undefined) {
  return useQuery({
    queryKey: ["hoodBucks", "balance", memberId],
    queryFn: () => fetchBalance(memberId!),
    enabled: !!memberId,
    staleTime: 30000, // 30 seconds
  });
}

export function useHoodBucksTransactions(memberId: string | undefined, tripId?: string) {
  return useQuery({
    queryKey: ["hoodBucks", "transactions", memberId, tripId],
    queryFn: () => fetchTransactions(memberId!, tripId),
    enabled: !!memberId,
  });
}

export function useGrantBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: grantBonus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hoodBucks", "balance", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["hoodBucks", "transactions", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.tripId] });
    },
  });
}

// Hook to get leaderboard for a trip
export function useTripLeaderboard(tripId: string | undefined) {
  return useQuery({
    queryKey: ["hoodBucks", "leaderboard", tripId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/leaderboard?tripId=${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.data as {
        rank: number;
        memberId: string;
        name: string;
        avatarUrl: string | null;
        balance: number;
      }[];
    },
    enabled: !!tripId,
    staleTime: 60000, // 1 minute
  });
}
