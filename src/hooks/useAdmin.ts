"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminStats, AdminUserListItem, AdminTripListItem, ActivityLogItem, PaginatedResponse } from "@/types";
import type { AdminUserUpdateInput, AdminTripUpdateInput, ActivityLogUpdateInput } from "@/lib/validations";

const API = "/api/admin";

// Stats
async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API}/stats`);
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  const data = await res.json();
  return data.data;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });
}

// Users
async function fetchAdminUsers(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminUserListItem>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API}/users?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.data;
}

export function useAdminUsers(params: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchAdminUsers(params),
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: AdminUserUpdateInput }) => {
      const res = await fetch(`${API}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update user");
      }
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

// Trips
async function fetchAdminTrips(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminTripListItem>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API}/trips?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch trips");
  const data = await res.json();
  return data.data;
}

export function useAdminTrips(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "trips", params],
    queryFn: () => fetchAdminTrips(params),
  });
}

export function useAdminUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: AdminTripUpdateInput }) => {
      const res = await fetch(`${API}/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update trip");
      }
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useAdminDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`${API}/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to delete trip");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

// Activity Logs
async function fetchAdminActivity(params: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ActivityLogItem & { trip?: { id: string; title: string } }>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API}/activity?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch activity logs");
  const data = await res.json();
  return data.data;
}

export function useAdminActivity(params: { search?: string; type?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "activity", params],
    queryFn: () => fetchAdminActivity(params),
  });
}

export function useAdminUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ActivityLogUpdateInput }) => {
      const res = await fetch(`${API}/activity/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update activity");
      }
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useAdminDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/activity/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to delete activity");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

// Site Settings
export interface SiteSettings {
  id: string;
  hiddenActivityTypes: string[];
  updatedAt: string;
}

async function fetchAdminSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  const data = await res.json();
  return data.data;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchAdminSettings,
  });
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { hiddenActivityTypes: string[] }) => {
      const res = await fetch(`${API}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update settings");
      }
      return (await res.json()).data as SiteSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}
