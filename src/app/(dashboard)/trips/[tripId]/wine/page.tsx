"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Wine } from "lucide-react";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { useWineEvents } from "@/hooks/useWineEvents";
import { WineEventCard } from "@/components/wine/WineEventCard";
import { WineEventFormModal } from "@/components/wine/WineEventFormModal";
import type { WineEventWithDetails } from "@/types";

export default function WinePage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: events, isLoading } = useWineEvents(tripId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WineEventWithDetails | null>(null);

  if (isLoading) {
    return <LoadingPage message="Loading tasting events..." />;
  }

  const handleEdit = (event: WineEventWithDetails) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingEvent(null);
  };

  return (
    <div className="wine-page -mx-4 -mt-6 -mb-20 px-4 pt-6 pb-20 lg:-mx-6 lg:px-6 lg:-mb-6 lg:pb-6 rounded-t-2xl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${tripId}`}>
              <button className="p-2 rounded-lg text-[#A08060] hover:text-[#C9A040] transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="font-wine text-3xl font-bold text-[#C9A040]">Blind Tasting</h1>
              <p className="text-sm text-[#A08060]">
                {events?.length || 0} event{events?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button onClick={() => setFormOpen(true)} className="wine-btn wine-btn-sm">
            <Plus className="h-4 w-4" />
            New Tasting Event
          </button>
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
              />
            ))}
          </div>
        ) : (
          <div className="wine-card text-center py-12 space-y-4">
            <Wine className="h-12 w-12 mx-auto text-[#C9A040]/50" />
            <h3 className="font-wine text-xl text-[#F0E3C7]">No tasting events</h3>
            <p className="text-sm text-[#A08060] max-w-xs mx-auto">
              Create a blind tasting event for wine, chili, BBQ, or anything else.
            </p>
            <button onClick={() => setFormOpen(true)} className="wine-btn wine-btn-sm mx-auto !w-auto">
              <Plus className="h-4 w-4" />
              Create Tasting Event
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      <WineEventFormModal
        open={formOpen}
        onOpenChange={handleFormClose}
        tripId={tripId}
        event={editingEvent}
      />
    </div>
  );
}
