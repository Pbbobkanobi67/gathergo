"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

interface MemberInfo {
  id: string;
  guestName: string | null;
  role: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

interface TripPhoto {
  id: string;
  tripId: string;
  imageUrl: string;
  caption: string | null;
  takenAt: string | null;
  uploadedByMemberId: string | null;
  uploadedBy: MemberInfo | null;
  createdAt: string;
}

async function fetchPhotos(tripId: string): Promise<TripPhoto[]> {
  const res = await fetch(`${API_BASE}/${tripId}/photos`);
  if (!res.ok) throw new Error("Failed to fetch photos");
  const json = await res.json();
  return json.data;
}

async function createPhoto(input: {
  tripId: string;
  imageUrl: string;
  caption?: string;
  takenAt?: string;
}): Promise<TripPhoto> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to upload photo");
  }
  const json = await res.json();
  return json.data;
}

async function deletePhoto(input: { tripId: string; photoId: string }): Promise<void> {
  const { tripId, photoId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/photos/${photoId}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete photo");
  }
}

export function usePhotos(tripId: string | undefined) {
  return useQuery({
    queryKey: ["photos", tripId],
    queryFn: () => fetchPhotos(tripId!),
    enabled: !!tripId,
  });
}

export function useCreatePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPhoto,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.tripId] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.tripId] });
    },
  });
}

export type { TripPhoto };
