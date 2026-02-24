"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Package,
  Check,
  Trash2,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  usePackingItems,
  useCreatePackingItem,
  useUpdatePackingItem,
  useDeletePackingItem,
} from "@/hooks/usePacking";
import { useMembers } from "@/hooks/useMembers";
import { PACKING_CATEGORIES } from "@/constants";

export default function PackingPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: items, isLoading } = usePackingItems(tripId);
  const { data: members } = useMembers(tripId);
  const createItem = useCreatePackingItem();
  const updateItem = useUpdatePackingItem();
  const deleteItem = useDeletePackingItem();

  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "OTHER" as string,
    quantity: "1",
    forEveryone: false,
    notes: "",
  });

  if (isLoading) {
    return <LoadingPage message="Loading packing list..." />;
  }

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    try {
      await createItem.mutateAsync({
        tripId,
        name: newItem.name,
        category: newItem.category,
        quantity: parseInt(newItem.quantity) || 1,
        forEveryone: newItem.forEveryone,
        notes: newItem.notes || undefined,
      });
      setNewItem({ name: "", category: "OTHER", quantity: "1", forEveryone: false, notes: "" });
      setAddOpen(false);
    } catch {
      // Error on createItem.error
    }
  };

  const handleTogglePacked = async (itemId: string, currentlyPacked: boolean) => {
    await updateItem.mutateAsync({
      tripId,
      itemId,
      data: { isPacked: !currentlyPacked },
    });
  };

  const handleClaim = async (itemId: string, memberId: string) => {
    await updateItem.mutateAsync({
      tripId,
      itemId,
      data: { claimedByMemberId: memberId || null },
    });
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem.mutateAsync({ tripId, itemId });
  };

  const getCategoryInfo = (cat: string) =>
    PACKING_CATEGORIES.find((c) => c.value === cat) || PACKING_CATEGORIES[8];

  const categoryOptions = PACKING_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  const memberOptions = [
    { value: "", label: "Unclaimed" },
    ...(members || []).map((m) => ({
      value: m.id,
      label: m.user?.name || m.guestName || "Guest",
    })),
  ];

  // Group items by category
  const itemsByCategory = (items || []).reduce(
    (acc: Record<string, NonNullable<typeof items>>, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, NonNullable<typeof items>>
  );

  const totalItems = items?.length || 0;
  const packedItems = items?.filter((i) => i.isPacked).length || 0;
  const claimedItems = items?.filter((i) => i.claimedByMemberId).length || 0;
  const sharedItems = items?.filter((i) => i.forEveryone).length || 0;

  const sortedCategories = PACKING_CATEGORIES.filter(
    (c) => itemsByCategory[c.value]?.length > 0
  );

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
            <h1 className="text-2xl font-bold text-slate-100">Packing List</h1>
            <p className="text-sm text-slate-400">
              {packedItems}/{totalItems} items packed
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-100">{totalItems}</p>
          <p className="text-xs text-slate-400">Total Items</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{packedItems}</p>
          <p className="text-xs text-slate-400">Packed</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-teal-400">{claimedItems}</p>
          <p className="text-xs text-slate-400">Claimed</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{sharedItems}</p>
          <p className="text-xs text-slate-400">Shared</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">Packing Progress</span>
            <span className="font-medium text-slate-100">
              {Math.round((packedItems / totalItems) * 100)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
              style={{ width: `${(packedItems / totalItems) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Items by Category */}
      {sortedCategories.length > 0 ? (
        <div className="space-y-6">
          {sortedCategories.map((cat) => {
            const catItems = itemsByCategory[cat.value] || [];
            const catPacked = catItems.filter((i) => i.isPacked).length;

            return (
              <div key={cat.value}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h2 className="text-lg font-semibold text-slate-200">
                    {cat.label}
                  </h2>
                  <Badge variant="secondary">
                    {catPacked}/{catItems.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) => {
                    const claimedName =
                      item.claimedBy?.user?.name ||
                      item.claimedBy?.guestName ||
                      null;

                    return (
                      <Card
                        key={item.id}
                        className={
                          item.isPacked
                            ? "border-green-500/30 bg-green-500/5"
                            : ""
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Pack Toggle */}
                            <button
                              onClick={() =>
                                handleTogglePacked(item.id, item.isPacked)
                              }
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                item.isPacked
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-slate-600 hover:border-teal-500"
                              }`}
                            >
                              {item.isPacked && (
                                <Check className="h-4 w-4" />
                              )}
                            </button>

                            {/* Item Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    item.isPacked
                                      ? "text-slate-500 line-through"
                                      : "text-slate-100"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.quantity > 1 && (
                                  <Badge variant="outline">
                                    x{item.quantity}
                                  </Badge>
                                )}
                                {item.forEveryone && (
                                  <Badge variant="purple">
                                    <Users className="mr-1 h-3 w-3" />
                                    Shared
                                  </Badge>
                                )}
                              </div>
                              {item.notes && (
                                <p className="text-xs text-slate-500">
                                  {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Claim */}
                            <div className="flex items-center gap-2">
                              {claimedName ? (
                                <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2 py-1">
                                  <UserAvatar
                                    name={claimedName}
                                    src={item.claimedBy?.user?.avatarUrl}
                                    size="sm"
                                  />
                                  <span className="text-xs text-slate-300">
                                    {claimedName}
                                  </span>
                                </div>
                              ) : (
                                <Select
                                  placeholder="Claim..."
                                  options={memberOptions}
                                  onChange={(e) =>
                                    e.target.value &&
                                    handleClaim(item.id, e.target.value)
                                  }
                                  className="h-7 w-32 text-xs"
                                />
                              )}

                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No packing items yet"
          description="Add items to your packing list to stay organized. You can assign items to specific people."
          actionLabel="Add Item"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-400" />
              Add Packing Item
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name" required>
                Item Name
              </Label>
              <Input
                id="item-name"
                placeholder="e.g., Sunscreen SPF 50"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  id="item-category"
                  options={categoryOptions}
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-qty">Quantity</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-notes">Notes</Label>
              <Input
                id="item-notes"
                placeholder="e.g., Reef-safe only"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={newItem.forEveryone}
                onChange={(e) =>
                  setNewItem({ ...newItem, forEveryone: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-sm text-slate-200">
                  Shared item (for the group)
                </span>
                <p className="text-xs text-slate-400">
                  Anyone can claim this item to bring it
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              isLoading={createItem.isPending}
              disabled={!newItem.name.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
