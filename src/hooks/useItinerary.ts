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

type ActivityCategoryType =
  | "DINING" | "ADVENTURE" | "RELAXATION" | "SHOPPING" | "TRAVEL"
  | "CHECK_IN" | "CHECK_OUT" | "MEALS" | "GAMES" | "MOVIES"
  | "SPORTS" | "NIGHTLIFE" | "SIGHTSEEING" | "ENTERTAINMENT" | "WELLNESS" | "OTHER";

interface ActivityRsvp {
  id: string;
  activityId: string;
  memberId: string;
  status: "INVITED" | "ACCEPTED" | "DECLINED" | "MAYBE";
  respondedAt: string | null;
  createdAt: string;
  member: MemberInfo;
}

interface LinkedMeal {
  id: string;
  title: string | null;
  mealType: string;
  date: string;
}

interface LinkedWineEvent {
  id: string;
  title: string;
  date: string;
}

interface Activity {
  id: string;
  tripId: string;
  itineraryDayId: string | null;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: ActivityCategoryType;
  reservationUrl: string | null;
  confirmationCode: string | null;
  cost: number | null;
  paidBy: string | null;
  status: "IDEA" | "VOTING" | "CONFIRMED" | "COMPLETED";
  voteCount: number;
  assignedToMemberId: string | null;
  createdByMemberId: string | null;
  createdBy: MemberInfo | null;
  assignedTo: MemberInfo | null;
  linkedMealId: string | null;
  linkedWineEventId: string | null;
  linkedMeal: LinkedMeal | null;
  linkedWineEvent: LinkedWineEvent | null;
  rsvps: ActivityRsvp[];
  createdAt: string;
  _count: { votes: number };
}

interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  title: string | null;
  notes: string | null;
  activities: Activity[];
}

interface CreateActivityInput {
  tripId: string;
  itineraryDayId?: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: ActivityCategoryType;
  reservationUrl?: string;
  confirmationCode?: string;
  cost?: number;
  paidBy?: string;
  assignedToMemberId?: string;
  linkedMealId?: string | null;
  linkedWineEventId?: string | null;
}

interface UpdateActivityInput {
  tripId: string;
  activityId: string;
  data: Partial<Omit<CreateActivityInput, "tripId">> & {
    status?: "IDEA" | "VOTING" | "CONFIRMED" | "COMPLETED";
  };
}

interface DeleteActivityInput {
  tripId: string;
  activityId: string;
}

// --- API functions ---

async function fetchItinerary(tripId: string): Promise<ItineraryDay[]> {
  const res = await fetch(`${API_BASE}/${tripId}/itinerary`);
  if (!res.ok) throw new Error("Failed to fetch itinerary");
  const json = await res.json();
  return json.data;
}

async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create activity");
  }
  const json = await res.json();
  return json.data;
}

async function updateActivity(input: UpdateActivityInput): Promise<Activity> {
  const { tripId, activityId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities/${activityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update activity");
  }
  const json = await res.json();
  return json.data;
}

async function deleteActivity(input: DeleteActivityInput): Promise<void> {
  const { tripId, activityId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/activities/${activityId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete activity");
  }
}

// --- Hooks ---

export function useItinerary(tripId: string | undefined) {
  return useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: () => fetchItinerary(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.tripId] });
    },
  });
}

export type {
  ItineraryDay, Activity, CreateActivityInput, UpdateActivityInput,
  DeleteActivityInput, MemberInfo, ActivityRsvp, LinkedMeal, LinkedWineEvent,
  ActivityCategoryType,
};
