"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Calendar, MapPin, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTrips } from "@/hooks/useTrip";
import { formatDate, getDaysUntil } from "@/lib/utils";
import { TRIP_TYPES, TRIP_STATUSES } from "@/constants";

export default function TripsPage() {
  const { data: trips, isLoading } = useTrips();

  if (isLoading) {
    return <LoadingPage message="Loading your trips..." />;
  }

  const getTripTypeInfo = (type: string) =>
    TRIP_TYPES.find((t) => t.value === type) ?? TRIP_TYPES[5];

  const getStatusInfo = (status: string) =>
    TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">My Trips</h1>
          <p className="mt-1 text-slate-400">
            Manage all your group trips in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Link href="/trips/new">
            <Button className="gap-2">
              <Plus className="h-5 w-5" />
              New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Trips Grid */}
      {trips && trips.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const typeInfo = getTripTypeInfo(trip.type);
            const statusInfo = getStatusInfo(trip.status);
            const daysUntil = getDaysUntil(trip.startDate);
            const isUpcoming = daysUntil > 0 && trip.status !== "COMPLETED" && trip.status !== "CANCELLED";

            return (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="group card-hover cursor-pointer overflow-hidden">
                  {/* Cover Image */}
                  <div className="relative h-40 bg-slate-800">
                    {trip.coverImageUrl ? (
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-6xl">{typeInfo.icon}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute left-3 top-3">
                      <Badge
                        variant={
                          trip.status === "ACTIVE"
                            ? "success"
                            : trip.status === "COMPLETED"
                            ? "secondary"
                            : trip.status === "CANCELLED"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Countdown */}
                    {isUpcoming && (
                      <div className="absolute right-3 top-3 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium text-amber-400">
                        {daysUntil} days
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className="text-xs text-slate-500">{typeInfo.label}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                      {trip.title}
                    </h3>

                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </p>

                      {trip.city && (
                        <p className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-4 w-4" />
                          {trip.city}, {trip.state}
                        </p>
                      )}

                      <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Users className="h-4 w-4" />
                        0 guests
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No trips yet"
          description="Create your first trip and start planning your adventure with friends."
          actionLabel="Create Your First Trip"
          onAction={() => window.location.href = "/trips/new"}
        />
      )}
    </div>
  );
}
