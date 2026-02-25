"use client";

import {
  DollarSign,
  Utensils,
  UserPlus,
  UserMinus,
  Wine,
  Trophy,
  Calendar,
  ThumbsUp,
  Package,
  Camera,
  FileText,
  Settings,
  MapPin,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import type { ActivityLogItem } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  DollarSign,
  Utensils,
  UserPlus,
  UserMinus,
  Wine,
  Trophy,
  Calendar,
  ThumbsUp,
  Package,
  Camera,
  FileText,
  Settings,
  MapPin,
  Bell,
  ChefHat: Utensils,
};

const COLOR_MAP: Record<string, string> = {
  EXPENSE_ADDED: "text-green-400",
  EXPENSE_UPDATED: "text-amber-400",
  EXPENSE_DELETED: "text-red-400",
  MEAL_CREATED: "text-orange-400",
  MEAL_ASSIGNED: "text-orange-400",
  MEAL_UPDATED: "text-amber-400",
  MEMBER_JOINED: "text-teal-400",
  MEMBER_LEFT: "text-red-400",
  WINE_EVENT_CREATED: "text-purple-400",
  WINE_ENTRY_SUBMITTED: "text-purple-400",
  WINE_SCORE_SUBMITTED: "text-purple-400",
  WINE_BET_PLACED: "text-amber-400",
  ACTIVITY_ADDED: "text-blue-400",
  ACTIVITY_VOTED: "text-blue-400",
  PACKING_ITEM_ADDED: "text-slate-400",
  PHOTO_UPLOADED: "text-pink-400",
  DOCUMENT_UPLOADED: "text-slate-400",
  TRIP_UPDATED: "text-teal-400",
  TRIP_CREATED: "text-teal-400",
  ANNOUNCEMENT_POSTED: "text-amber-400",
  HOOD_BUCKS_GRANTED: "text-amber-400",
  RECIPE_ADDED: "text-orange-400",
};

const TYPE_ICON_NAME: Record<string, string> = {
  EXPENSE_ADDED: "DollarSign",
  EXPENSE_UPDATED: "DollarSign",
  EXPENSE_DELETED: "DollarSign",
  MEAL_CREATED: "Utensils",
  MEAL_ASSIGNED: "Utensils",
  MEAL_UPDATED: "Utensils",
  MEMBER_JOINED: "UserPlus",
  MEMBER_LEFT: "UserMinus",
  WINE_EVENT_CREATED: "Wine",
  WINE_ENTRY_SUBMITTED: "Wine",
  WINE_SCORE_SUBMITTED: "Wine",
  WINE_BET_PLACED: "Trophy",
  ACTIVITY_ADDED: "Calendar",
  ACTIVITY_VOTED: "ThumbsUp",
  PACKING_ITEM_ADDED: "Package",
  PHOTO_UPLOADED: "Camera",
  DOCUMENT_UPLOADED: "FileText",
  TRIP_UPDATED: "Settings",
  TRIP_CREATED: "MapPin",
  ANNOUNCEMENT_POSTED: "Bell",
  HOOD_BUCKS_GRANTED: "Trophy",
  RECIPE_ADDED: "ChefHat",
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function ActivityItem({ item }: { item: ActivityLogItem }) {
  const iconName = TYPE_ICON_NAME[item.type] || "Calendar";
  const Icon = ICON_MAP[iconName] || Calendar;
  const color = COLOR_MAP[item.type] || "text-slate-400";

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-0.5 shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300 leading-snug">{item.action}</p>
        <p className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2 animate-pulse">
          <div className="h-4 w-4 rounded bg-slate-700 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-slate-700" />
            <div className="h-3 w-16 rounded bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({ tripId }: { tripId: string }) {
  const { data, isLoading } = useActivityFeed(tripId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ActivitySkeleton />
        ) : !data || data.items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-2">
            No activity yet. Actions like adding expenses or meals will appear here.
          </p>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data.items.slice(0, 10).map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
