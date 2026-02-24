"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useItinerary, useCreateActivity, useUpdateActivity, useDeleteActivity } from "@/hooks/useItinerary";
import { useVoteActivity } from "@/hooks/useWineEventDetail";
import { formatDate, formatTime } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from "@/constants";

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: days, isLoading } = useItinerary(tripId);
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const voteActivity = useVoteActivity();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addActivityDay, setAddActivityDay] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "OTHER" as "DINING" | "ADVENTURE" | "RELAXATION" | "SHOPPING" | "TRAVEL" | "OTHER",
  });

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

  const handleAddActivity = async (dayId: string) => {
    if (!newActivity.title.trim()) return;
    try {
      await createActivity.mutateAsync({
        tripId,
        itineraryDayId: dayId,
        title: newActivity.title,
        description: newActivity.description || undefined,
        startTime: newActivity.startTime || undefined,
        endTime: newActivity.endTime || undefined,
        location: newActivity.location || undefined,
        category: newActivity.category,
      });
      setNewActivity({ title: "", description: "", startTime: "", endTime: "", location: "", category: "OTHER" });
      setAddActivityDay(null);
      // Auto-expand the day
      setExpandedDays((prev) => new Set([...prev, dayId]));
    } catch {
      // Error on createActivity.error
    }
  };

  const handleStatusChange = async (activityId: string, status: "IDEA" | "VOTING" | "CONFIRMED" | "COMPLETED") => {
    await updateActivity.mutateAsync({
      tripId,
      activityId,
      data: { status },
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    await deleteActivity.mutateAsync({ tripId, activityId });
  };

  const handleVote = async (activityId: string) => {
    await voteActivity.mutateAsync({ tripId, activityId });
  };

  const getCategoryInfo = (cat: string) =>
    ACTIVITY_CATEGORIES.find((c) => c.value === cat) || ACTIVITY_CATEGORIES[5];

  const getStatusInfo = (status: string) =>
    ACTIVITY_STATUSES.find((s) => s.value === status) || ACTIVITY_STATUSES[0];

  const categoryOptions = ACTIVITY_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
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
            <h1 className="text-2xl font-bold text-slate-100">Itinerary</h1>
            <p className="text-sm text-slate-400">
              {days?.length || 0} days planned
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
                                <div className="flex items-center gap-2">
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
                                  <button
                                    onClick={() => handleVote(activity.id)}
                                    className="flex items-center gap-1 rounded-full border border-slate-600 px-2 py-0.5 transition-colors hover:border-teal-500 hover:text-teal-400"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    {activity.voteCount || 0}
                                  </button>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                {activity.status === "IDEA" && (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleStatusChange(activity.id, "CONFIRMED")}
                                    title="Confirm"
                                  >
                                    <ThumbsUp className="h-4 w-4 text-green-400" />
                                  </Button>
                                )}
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

      {/* Add Activity Dialog */}
      <Dialog open={!!addActivityDay} onOpenChange={(open) => !open && setAddActivityDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-400" />
              Add Activity
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="act-title" required>Title</Label>
              <Input
                id="act-title"
                placeholder="e.g., Hiking at Emerald Bay"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="act-category">Category</Label>
              <Select
                id="act-category"
                options={categoryOptions}
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as typeof newActivity.category })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="act-start">Start Time</Label>
                <Input
                  id="act-start"
                  type="time"
                  value={newActivity.startTime}
                  onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="act-end">End Time</Label>
                <Input
                  id="act-end"
                  type="time"
                  value={newActivity.endTime}
                  onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="act-location">Location</Label>
              <Input
                id="act-location"
                placeholder="e.g., Emerald Bay State Park"
                value={newActivity.location}
                onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="act-desc">Description</Label>
              <Textarea
                id="act-desc"
                placeholder="Details about this activity..."
                rows={3}
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddActivityDay(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => addActivityDay && handleAddActivity(addActivityDay)}
              isLoading={createActivity.isPending}
              disabled={!newActivity.title.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
