"use client";

import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { useUpdateShoppingItem, useDeleteShoppingItem, type ShoppingItemWithDetails } from "@/hooks/useShoppingItems";
import { SHOPPING_CATEGORIES, MEAL_TYPES } from "@/constants";
import { formatCurrency } from "@/lib/utils";

interface MemberOption {
  id: string;
  label: string;
}

interface GroceryListProps {
  items: ShoppingItemWithDetails[];
  tripId: string;
  members: MemberOption[];
  currentMemberId?: string | null;
}

export function GroceryList({ items, tripId, members, currentMemberId }: GroceryListProps) {
  const updateItem = useUpdateShoppingItem();
  const deleteItem = useDeleteShoppingItem();

  const totalItems = items.length;
  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const assignedCount = items.filter((i) => i.assignedToMemberId).length;
  const estimatedCost = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
  const progressPct = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;

  const handleTogglePurchased = async (item: ShoppingItemWithDetails) => {
    await updateItem.mutateAsync({
      tripId,
      itemId: item.id,
      data: {
        isPurchased: !item.isPurchased,
        purchasedByMemberId: !item.isPurchased ? (currentMemberId || null) : null,
      },
    });
  };

  const handleAssign = async (itemId: string, memberId: string) => {
    await updateItem.mutateAsync({
      tripId,
      itemId,
      data: { assignedToMemberId: memberId || null },
    });
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem.mutateAsync({ tripId, itemId });
  };

  const memberOptions = members.map((m) => ({ value: m.id, label: m.label }));

  // Group by category
  const grouped = SHOPPING_CATEGORIES.reduce<Record<string, ShoppingItemWithDetails[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat.value);
    if (catItems.length > 0) acc[cat.value] = catItems;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-100">{totalItems}</p>
          <p className="text-xs text-slate-400">Total Items</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{purchasedCount}</p>
          <p className="text-xs text-slate-400">Purchased</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{assignedCount}</p>
          <p className="text-xs text-slate-400">Assigned</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(estimatedCost)}</p>
          <p className="text-xs text-slate-400">Est. Cost</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Shopping Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Grouped Items */}
      {Object.entries(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems]) => {
            const catInfo = SHOPPING_CATEGORIES.find((c) => c.value === category);
            return (
              <div key={category}>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <span>{catInfo?.icon}</span>
                  {catInfo?.label || category}
                  <Badge variant="secondary" className="text-[10px]">{catItems.length}</Badge>
                </h4>
                <div className="space-y-1">
                  {catItems.map((item) => {
                    const mealTypeInfo = item.mealNight
                      ? MEAL_TYPES.find((t) => t.value === item.mealNight!.mealType)
                      : null;
                    const assignedName = item.assignedTo?.user?.name || item.assignedTo?.guestName || null;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                          item.isPurchased
                            ? "border-green-800/50 bg-green-900/20"
                            : "border-slate-700 bg-slate-800/50"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleTogglePurchased(item)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            item.isPurchased
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-slate-600 hover:border-teal-500"
                          }`}
                        >
                          {item.isPurchased && <Check className="h-3 w-3" />}
                        </button>

                        {/* Item details */}
                        <div className="min-w-0 flex-1">
                          <span className={`text-sm ${item.isPurchased ? "text-slate-500 line-through" : "text-slate-200"}`}>
                            {item.name}
                          </span>
                          {(item.quantity > 1 || item.unit) && (
                            <span className="ml-1 text-xs text-slate-500">
                              ({item.quantity}{item.unit ? ` ${item.unit}` : ""})
                            </span>
                          )}
                        </div>

                        {/* Linked meal badge */}
                        {item.mealNight && mealTypeInfo && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                            <span>{mealTypeInfo.icon}</span>
                            {item.mealNight.title || mealTypeInfo.label}
                          </Badge>
                        )}

                        {/* Assigned member */}
                        {assignedName ? (
                          <UserAvatar name={assignedName} src={item.assignedTo?.user?.avatarUrl} size="sm" />
                        ) : (
                          <Select
                            placeholder="Assign"
                            options={memberOptions}
                            onChange={(e) => e.target.value && handleAssign(item.id, e.target.value)}
                            className="h-7 w-28 text-[10px]"
                          />
                        )}

                        {/* Cost */}
                        {item.estimatedCost != null && item.estimatedCost > 0 && (
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatCurrency(item.estimatedCost)}
                          </span>
                        )}

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
                          className="shrink-0 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No grocery items yet. Add items to start your shopping list.
        </p>
      )}
    </div>
  );
}
