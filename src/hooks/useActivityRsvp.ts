"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

interface SendRsvpsInput {
  tripId: string;
  activityId: string;
  memberIds: string[];
}

interface RespondRsvpInput {
  tripId: string;
  activityId: string;
  status: "ACCEPTED" | "DECLINED" | "MAYBE";
}

async function sendRsvps(input: SendRsvpsInput) {
  const { tripId, activityId, memberIds } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities/${activityId}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to send RSVPs");
  }
  const json = await res.json();
  return json.data;
}

async function respondRsvp(input: RespondRsvpInput) {
  const { tripId, activityId, status } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities/${activityId}/rsvp`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to respond to RSVP");
  }
  const json = await res.json();
  return json.data;
}

export function useSendRsvps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendRsvps,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}

export function useRespondRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondRsvp,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}
