"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, ExpenseSplit, User } from "@/generated/prisma";

const API_BASE = "/api/trips";

// Response types matching the API include shape
interface MemberInfo {
  id: string;
  guestName: string | null;
  role: string;
  userId: string | null;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl" | "venmoHandle"> | null;
}

interface SplitWithMember extends ExpenseSplit {
  member: MemberInfo;
}

interface ExpenseWithDetails extends Expense {
  paidByUser: Pick<User, "id" | "name" | "email" | "avatarUrl" | "venmoHandle"> | null;
  splits: SplitWithMember[];
}

interface CreateExpenseInput {
  tripId: string;
  title: string;
  category?: string;
  amount: number;
  currency?: string;
  date?: string;
  splitType?: string;
  receiptImageUrl?: string;
  notes?: string;
  splits?: Array<{ memberId: string; amount: number }>;
}

interface UpdateExpenseInput {
  tripId: string;
  expenseId: string;
  data: Record<string, unknown>;
}

interface DeleteExpenseInput {
  tripId: string;
  expenseId: string;
}

async function fetchExpenses(tripId: string): Promise<ExpenseWithDetails[]> {
  const res = await fetch(`${API_BASE}/${tripId}/expenses`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  const json = await res.json();
  return json.data;
}

async function createExpense(input: CreateExpenseInput): Promise<ExpenseWithDetails> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create expense");
  }
  const json = await res.json();
  return json.data;
}

async function updateExpense(input: UpdateExpenseInput): Promise<ExpenseWithDetails> {
  const { tripId, expenseId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/expenses/${expenseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update expense");
  }
  const json = await res.json();
  return json.data;
}

async function deleteExpense(input: DeleteExpenseInput): Promise<void> {
  const { tripId, expenseId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/expenses/${expenseId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete expense");
  }
}

export function useExpenses(tripId: string | undefined) {
  return useQuery({
    queryKey: ["expenses", tripId],
    queryFn: () => fetchExpenses(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.tripId] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.tripId] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.tripId] });
    },
  });
}

export type { ExpenseWithDetails, SplitWithMember, MemberInfo, CreateExpenseInput, UpdateExpenseInput, DeleteExpenseInput };
