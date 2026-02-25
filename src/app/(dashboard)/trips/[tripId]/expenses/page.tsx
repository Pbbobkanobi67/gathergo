"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from "@/constants";

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: expenses, isLoading } = useExpenses(tripId);
  const createExpense = useCreateExpense();

  const [addOpen, setAddOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "OTHER",
    splitType: "EQUAL",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  if (isLoading) {
    return <LoadingPage message="Loading expenses..." />;
  }

  const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const expenseCount = expenses?.length || 0;

  // Category breakdown
  const categoryTotals = (expenses || []).reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = async () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;
    try {
      await createExpense.mutateAsync({
        tripId,
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        splitType: newExpense.splitType,
        date: newExpense.date || undefined,
        notes: newExpense.notes || undefined,
      });
      setNewExpense({
        title: "",
        amount: "",
        category: "OTHER",
        splitType: "EQUAL",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setAddOpen(false);
    } catch {
      // Error on createExpense.error
    }
  };

  const getCategoryInfo = (cat: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === cat) || EXPENSE_CATEGORIES[5];

  const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  const splitTypeOptions = SPLIT_TYPES.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
            <p className="text-sm text-slate-400">
              {expenseCount} expense{expenseCount !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/20 p-3">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {formatCurrency(totalSpent)}
              </p>
              <p className="text-sm text-slate-400">Total Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Receipt className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{expenseCount}</p>
              <p className="text-sm text-slate-400">Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-amber-500/20 p-3">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {formatCurrency(expenseCount > 0 ? totalSpent / expenseCount : 0)}
              </p>
              <p className="text-sm text-slate-400">Avg per Expense</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, amount]) => {
                  const info = getCategoryInfo(cat);
                  const pct = totalSpent > 0 ? ((amount as number) / totalSpent) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-lg">{info.icon}</span>
                      <span className="w-24 text-sm text-slate-200">{info.label}</span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-teal-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-20 text-right text-sm font-medium text-slate-200">
                        {formatCurrency(amount as number)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {expenses && expenses.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">All Expenses</h2>
          {expenses.map((expense) => {
            const catInfo = getCategoryInfo(expense.category);
            const paidCount = expense.splits?.filter((s) => s.isPaid).length || 0;
            const totalSplits = expense.splits?.length || 0;

            return (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{catInfo.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-100">{expense.title}</h3>
                        <Badge variant="secondary">{catInfo.label}</Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </span>
                        {expense.paidByUser && (
                          <span className="flex items-center gap-1">
                            Paid by
                            <UserAvatar
                              name={expense.paidByUser.name}
                              src={expense.paidByUser.avatarUrl}
                              size="sm"
                            />
                            {expense.paidByUser.name}
                          </span>
                        )}
                        {totalSplits > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Split {totalSplits} ways
                          </span>
                        )}
                        {totalSplits > 0 && (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {paidCount}/{totalSplits} settled
                          </span>
                        )}
                      </div>

                      {expense.notes && (
                        <p className="mt-2 text-sm text-slate-400">{expense.notes}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-slate-100">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {expense.splitType === "EQUAL"
                          ? "Split equally"
                          : expense.splitType === "CUSTOM"
                          ? "Custom split"
                          : "No split"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Track shared expenses and split costs evenly among the group."
          actionLabel="Add First Expense"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Add Expense
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-title" required>Description</Label>
              <Input
                id="exp-title"
                placeholder="e.g., Groceries at Safeway"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-amount" required>Amount ($)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-category">Category</Label>
                <Select
                  id="exp-category"
                  options={categoryOptions}
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-split">Split Type</Label>
                <Select
                  id="exp-split"
                  options={splitTypeOptions}
                  value={newExpense.splitType}
                  onChange={(e) => setNewExpense({ ...newExpense, splitType: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-notes">Notes (optional)</Label>
              <Textarea
                id="exp-notes"
                placeholder="Any details..."
                rows={2}
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createExpense.isPending}
              disabled={!newExpense.title.trim() || !newExpense.amount}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
