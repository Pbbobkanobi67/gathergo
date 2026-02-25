"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AiChatMessage } from "@/types";

async function sendChatMessage(
  tripId: string,
  message: string,
  history: AiChatMessage[]
): Promise<string> {
  const res = await fetch(`/api/trips/${tripId}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to get AI response");
  }
  const data = await res.json();
  return data.data.message;
}

export function useAiChat(tripId: string) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(tripId, message, messages),
    onMutate: (message) => {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
    },
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." },
      ]);
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (message.trim() && !mutation.isPending) {
        mutation.mutate(message.trim());
      }
    },
    [mutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading: mutation.isPending,
  };
}
