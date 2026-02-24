"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TripMember } from "@/generated/prisma";

const API_BASE = "/api/trips";

interface MemberWithUser extends TripMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    venmoHandle?: string | null;
  } | null;
}

interface AddMemberInput {
  tripId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  role?: string;
}

interface UpdateMemberInput {
  tripId: string;
  memberId: string;
  data: Record<string, unknown>;
}

async function fetchMembers(tripId: string): Promise<MemberWithUser[]> {
  const res = await fetch(`${API_BASE}/${tripId}/members`);
  if (!res.ok) throw new Error("Failed to fetch members");
  const json = await res.json();
  return json.data;
}

async function addMember(input: AddMemberInput): Promise<MemberWithUser> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to add member");
  }
  const json = await res.json();
  return json.data;
}

async function updateMember(input: UpdateMemberInput): Promise<MemberWithUser> {
  const { tripId, memberId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update member");
  }
  const json = await res.json();
  return json.data;
}

async function removeMember(input: { tripId: string; memberId: string }): Promise<void> {
  const { tripId, memberId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/members/${memberId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to remove member");
  }
}

export function useMembers(tripId: string | undefined) {
  return useQuery({
    queryKey: ["tripMembers", tripId],
    queryFn: () => fetchMembers(tripId!),
    enabled: !!tripId,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
    },
  });
}

export type { MemberWithUser };
