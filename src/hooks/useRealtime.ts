"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, subscribeToChannel, unsubscribeFromChannel } from "@/lib/supabase";

type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

interface RealtimePayload {
  eventType: RealtimeEventType;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

// Hook for subscribing to trip-level updates
export function useTripRealtime(tripId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tripId) return;

    const channelName = `trip:${tripId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
          queryClient.invalidateQueries({ queryKey: ["tripMembers", tripId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chatMessages", tripId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["announcements", tripId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);
}

// Hook for subscribing to wine event updates
export function useWineEventRealtime(eventId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const channelName = `wine:${eventId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wine_events",
          filter: `id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wineEvent", eventId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wine_scores",
          filter: `wine_event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wineEvent", eventId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wine_entries",
          filter: `wine_event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wineEvent", eventId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wine_bets",
          filter: `wine_event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wineEvent", eventId] });
          queryClient.invalidateQueries({ queryKey: ["hoodBucks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);
}

// Hook for subscribing to Hood Bucks balance updates
export function useHoodBucksRealtime(memberId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!memberId) return;

    const channelName = `hoodbucks:${memberId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hood_bucks_transactions",
          filter: `member_id=eq.${memberId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hoodBucks", "balance", memberId] });
          queryClient.invalidateQueries({ queryKey: ["hoodBucks", "transactions", memberId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, queryClient]);
}

// Generic hook for custom realtime subscriptions
export function useRealtimeSubscription(
  channelName: string,
  table: string,
  filter: string,
  onEvent: (payload: RealtimePayload) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          onEvent(payload as unknown as RealtimePayload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, onEvent, enabled]);
}

// Hook for chat messages with callback
export function useChatRealtime(
  tripId: string | undefined,
  onNewMessage: (message: Record<string, unknown>) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tripId) return;

    const channelName = `chat:${tripId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Record<string, unknown>);
          queryClient.invalidateQueries({ queryKey: ["chatMessages", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, onNewMessage, queryClient]);
}
