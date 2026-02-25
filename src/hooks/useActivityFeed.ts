"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityLogItem, PaginatedResponse } from "@/types";

async function fetchActivityFeed(
  tripId: string,
  page: number,
  type?: string
): Promise<PaginatedResponse<ActivityLogItem>> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (type) params.set("type", type);

  const res = await fetch(`/api/trips/${tripId}/activity?${params}`);
  if (!res.ok) throw new Error("Failed to fetch activity feed");
  const data = await res.json();
  return data.data;
}

export function useActivityFeed(tripId: string, page = 1, type?: string) {
  return useQuery({
    queryKey: ["activity-feed", tripId, page, type],
    queryFn: () => fetchActivityFeed(tripId, page, type),
  });
}
