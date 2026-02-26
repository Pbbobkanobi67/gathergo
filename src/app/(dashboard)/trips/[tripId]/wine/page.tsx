"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useWineEvents, useUpdateWineEvent } from "@/hooks/useWineEvents";
import { WineEventCard } from "@/components/wine/WineEventCard";
import { WineEventFormModal } from "@/components/wine/WineEventFormModal";
import type { WineEventWithDetails } from "@/types";

export default function WinePage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: events, isLoading } = useWineEvents(tripId);
  const updateEvent = useUpdateWineEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WineEventWithDetails | null>(null);

  if (isLoading) {
    return <LoadingPage message="Loading wine events..." />;
  }

  const handleStatusAdvance = async (eventId: string, currentStatus: string) => {
    const statusOrder = ["SETUP", "OPEN", "SCORING", "REVEAL", "COMPLETE"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      await updateEvent.mutateAsync({
        tripId,
        eventId,
        data: { status: statusOrder[currentIndex + 1] },
      });
    }
  };

  const handleEdit = (event: WineEventWithDetails) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingEvent(null);
  };

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
            <h1 className="text-2xl font-bold text-slate-100">Wine Tasting</h1>
            <p className="text-sm text-slate-400">
              {events?.length || 0} event{events?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Wine Event
        </Button>
      </div>

      {/* Events */}
      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <WineEventCard
              key={event.id}
              event={event}
              tripId={tripId}
              onEdit={handleEdit}
              onStatusAdvance={handleStatusAdvance}
              isAdvancing={updateEvent.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wine}
          title="No wine events"
          description="Create a blind wine tasting event. Guests bring wine, taste blind, and vote for their favorites!"
          actionLabel="Create Wine Event"
          onAction={() => setFormOpen(true)}
        />
      )}

      {/* Add/Edit Wine Event Modal */}
      <WineEventFormModal
        open={formOpen}
        onOpenChange={handleFormClose}
        tripId={tripId}
        event={editingEvent}
      />
    </div>
  );
}
