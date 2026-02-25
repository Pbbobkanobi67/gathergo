"use client";

import { useQuery } from "@tanstack/react-query";
import type { CurrentUser } from "@/types";

async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Failed to fetch current user");
  const data = await res.json();
  return data.data;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
  });
}
