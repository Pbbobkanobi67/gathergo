"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  MapPin,
  ThumbsUp,
  ChevronDown,
  ChevronRight,
  Pencil,
  ExternalLink,
  DollarSign,
  Utensils,
  Wine,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActivityFormModal } from "@/components/itinerary/ActivityFormModal";
import { ActivityRsvpSection } from "@/components/itinerary/ActivityRsvpSection";
import { useItinerary, useDeleteActivity, type Activity } from "@/hooks/useItinerary";
import { useVoteActivity } from "@/hooks/useWineEventDetail";
import { useMembers } from "@/hooks/useMembers";
import { useMeals } from "@/hooks/useMeals";
import { useWineEvents } from "@/hooks/useWineEvents";
import { useSyncActivities } from "@/hooks/useActivitySync";
import { useSafeUser } from "@/components/shared/SafeClerkUser";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from "@/constants";

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: days, isLoading } = useItinerary(tripId);
  const { data: membersData } = useMembers(tripId);
  const { data: mealsData } = useMeals(tripId);
  const { data: wineEventsData } = useWineEvents(tripId);
  const deleteActivity = useDeleteActivity();
  const voteActivity = useVoteActivity();
  const syncActivities = useSyncActivities();
  const { user: clerkUser } = useSafeUser();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addActivityDay, setAddActivityDay] = useState<string | null>(null);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  // Map members to MemberInfo shape for components
  const members = useMemo(() =>
    (membersData || []).map((m: { id: string; guestName: string | null; role: string; user: { id: string; name: string; avatarUrl: string | null } | null }) => ({
      id: m.id,
      guestName: m.guestName,
      role: m.role,
      user: m.user ? { id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl } : null,
    })),
    [membersData]
  );

  // Find current user's member ID
  const currentMemberId = useMemo(() => {
    if (!clerkUser || !membersData) return null;
    const found = membersData.find((m: { userId: string | null }) => m.userId === clerkUser.id);
    return found?.id || null;
  }, [clerkUser, membersData]);

  // Meals/wine for cross-system linking
  const meals = useMemo(() =>
    (mealsData || []).map((m: { id: string; title: string | null; mealType: string; date: string | Date }) => ({
      id: m.id,
      title: m.title,
      mealType: m.mealType,
      date: typeof m.date === "string" ? m.date : (m.date as Date).toISOString(),
    })),
    [mealsData]
  );

  const wineEvents = useMemo(() =>
    (wineEventsData || []).map((w: { id: string; title: string; date: string | Date }) => ({
      id: w.id,
      title: w.title,
      date: typeof w.date === "string" ? w.date : (w.date as Date).toISOString(),
    })),
    [wineEventsData]
  );

  if (isLoading) {
    return <LoadingPage message="Loading itinerary..." />;
  }

  const toggleDay = (dayId: string) => {
    const next = new Set(expandedDays);
    if (next.has(dayId)) next.delete(dayId);
    else next.add(dayId);
    setExpandedDays(next);
  };

  const expandAll = () => {
    if (days) setExpandedDays(new Set(days.map((d) => d.id)));
  };

  const collapseAll = () => setExpandedDays(new Set());

  const handleDeleteActivity = async (activityId: string) => {
    await deleteActivity.mutateAsync({ tripId, activityId });
  };

  const handleVote = async (activityId: string) => {
    await voteActivity.mutateAsync({ tripId, activityId });
  };

  const handleSync = async () => {
    await syncActivities.mutateAsync({ tripId });
  };

  const getCategoryInfo = (cat: string) =>
    ACTIVITY_CATEGORIES.find((c) => c.value === cat) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];

  const getStatusInfo = (status: string) =>
    ACTIVITY_STATUSES.find((s) => s.value === status) || ACTIVITY_STATUSES[0];

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
            <h1 className="text-2xl font-bold text-slate-100">Itinerary</h1>
            <p className="text-sm text-slate-400">
              {days?.length || 0} days planned
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            isLoading={syncActivities.isPending}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Meals/Wine
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Days */}
      {days && days.length > 0 ? (
        <div className="space-y-4">
          {days.map((day, index) => {
            const isExpanded = expandedDays.has(day.id);
            const activityCount = day.activities?.length || 0;

            return (
              <Card key={day.id}>
                <button
                  onClick={() => toggleDay(day.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-sm font-bold text-teal-400">
                      D{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">
                        {day.title || `Day ${index + 1}`}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {formatDate(day.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activityCount > 0 && (
                      <Badge variant="secondary">{activityCount} activities</Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="border-t border-slate-700 pt-4">
                    {day.activities && day.activities.length > 0 ? (
                      <div className="space-y-3">
                        {day.activities.map((activity) => {
                          const catInfo = getCategoryInfo(activity.category);
                          const statusInfo = getStatusInfo(activity.status);

                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                            >
                              <span className="text-xl">{catInfo.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-slate-100">
                                    {activity.title}
                                  </h4>
                                  <Badge
                                    variant={
                                      activity.status === "CONFIRMED"
                                        ? "success"
                                        : activity.status === "VOTING"
                                        ? "warning"
                                        : activity.status === "COMPLETED"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                  {/* Linked entity badges */}
                                  {activity.linkedMeal && (
                                    <Badge variant="warning" className="gap-1 text-[10px]">
                                      <Utensils className="h-2.5 w-2.5" />
                                      {activity.linkedMeal.title || activity.linkedMeal.mealType}
                                    </Badge>
                                  )}
                                  {activity.linkedWineEvent && (
                                    <Badge variant="purple" className="gap-1 text-[10px]">
                                      <Wine className="h-2.5 w-2.5" />
                                      {activity.linkedWineEvent.title}
                                    </Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="mt-1 text-sm text-slate-400">
                                    {activity.description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                                  {activity.startTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(activity.startTime)}
                                      {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                                    </span>
                                  )}
                                  {activity.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {activity.location}
                                    </span>
                                  )}
                                  {activity.cost != null && activity.cost > 0 && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {formatCurrency(activity.cost)}
                                      {activity.paidBy && <span className="text-slate-500">({activity.paidBy})</span>}
                                    </span>
                                  )}
                                  {activity.reservationUrl && (
                                    <a
                                      href={activity.reservationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Reservation
                                    </a>
                                  )}
                                  {activity.confirmationCode && (
                                    <span className="font-mono text-slate-300">
                                      #{activity.confirmationCode}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleVote(activity.id)}
                                    className="flex items-center gap-1 rounded-full border border-slate-600 px-2 py-0.5 transition-colors hover:border-teal-500 hover:text-teal-400"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    {activity.voteCount || activity._count?.votes || 0}
                                  </button>
                                </div>

                                {/* RSVP Section */}
                                <ActivityRsvpSection
                                  tripId={tripId}
                                  activityId={activity.id}
                                  rsvps={activity.rsvps || []}
                                  currentMemberId={currentMemberId}
                                />
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setEditActivity(activity)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4 text-slate-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  title="Remove"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  &times;
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-slate-500">
                        No activities yet
                      </p>
                    )}

                    <Button
                      variant="ghost"
                      className="mt-3 w-full gap-2 border border-dashed border-slate-700 text-slate-400 hover:text-teal-400"
                      onClick={() => setAddActivityDay(day.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Activity
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No itinerary days"
          description="Itinerary days are created automatically when you create a trip."
        />
      )}

      {/* Add Activity Modal */}
      <ActivityFormModal
        open={!!addActivityDay}
        onOpenChange={(open) => { if (!open) setAddActivityDay(null); }}
        tripId={tripId}
        dayId={addActivityDay || undefined}
        activity={null}
        members={members}
        meals={meals}
        wineEvents={wineEvents}
      />

      {/* Edit Activity Modal */}
      <ActivityFormModal
        open={!!editActivity}
        onOpenChange={(open) => { if (!open) setEditActivity(null); }}
        tripId={tripId}
        dayId={editActivity?.itineraryDayId || undefined}
        activity={editActivity}
        members={members}
        meals={meals}
        wineEvents={wineEvents}
      />
    </div>
  );
}
