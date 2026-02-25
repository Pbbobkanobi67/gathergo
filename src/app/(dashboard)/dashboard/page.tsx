"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useSafeUser } from "@/components/shared/SafeClerkUser";
import { Plus, Calendar, MapPin, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTrips } from "@/hooks/useTrip";
import { formatDate, getDaysUntil } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoaded } = useSafeUser();
  const { data: trips, isLoading } = useTrips();

  if (!isLoaded || isLoading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  const upcomingTrips = trips?.filter(
    (trip) => new Date(trip.startDate) > new Date() && trip.status !== "CANCELLED"
  ) ?? [];

  const activeTrips = trips?.filter(
    (trip) => trip.status === "ACTIVE"
  ) ?? [];

  const nextTrip = upcomingTrips[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back, {user?.firstName || "Traveler"}
          </h1>
          <p className="mt-1 text-slate-400">
            Here&apos;s what&apos;s happening with your trips
          </p>
        </div>
        <Link href="/trips/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            New Trip
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-2 border-t-teal-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-teal-500/20 p-3 ring-1 ring-teal-500/20">
              <Calendar className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {upcomingTrips.length}
              </p>
              <p className="text-sm text-slate-400">Upcoming Trips</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-amber-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-500/20 p-3 ring-1 ring-amber-500/20">
              <MapPin className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {activeTrips.length}
              </p>
              <p className="text-sm text-slate-400">Active Now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-purple-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-500/20 p-3 ring-1 ring-purple-500/20">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {trips?.length ?? 0}
              </p>
              <p className="text-sm text-slate-400">Total Trips</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-green-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/20 p-3 ring-1 ring-green-500/20">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">1,000</p>
              <p className="text-sm text-slate-400">Hood Bucks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Trip */}
      {nextTrip ? (
        <Card className="overflow-hidden">
          <div className="relative">
            {nextTrip.coverImageUrl && (
              <div
                className="h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${nextTrip.coverImageUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              </div>
            )}
            <div className={`p-6 ${nextTrip.coverImageUrl ? "absolute bottom-0 left-0 right-0" : ""}`}>
              <Badge variant="success" className="mb-2">
                {getDaysUntil(nextTrip.startDate)} days away
              </Badge>
              <h2 className="text-2xl font-bold text-slate-100">{nextTrip.title}</h2>
              <p className="mt-1 text-slate-300">
                {formatDate(nextTrip.startDate)} - {formatDate(nextTrip.endDate)}
              </p>
              {nextTrip.city && (
                <p className="mt-1 flex items-center gap-1 text-slate-400">
                  <MapPin className="h-4 w-4" />
                  {nextTrip.city}, {nextTrip.state}
                </p>
              )}
            </div>
          </div>
          <CardContent className="border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4" />
                <span>Guests confirmed</span>
              </div>
              <Link href={`/trips/${nextTrip.id}`}>
                <Button variant="outline">View Trip</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No upcoming trips"
          description="Create your first trip to start planning your next adventure with friends."
          actionLabel="Create a Trip"
          onAction={() => window.location.href = "/trips/new"}
        />
      )}

      {/* All Trips */}
      {trips && trips.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">All Trips</h2>
            <Link href="/trips">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.slice(0, 6).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="card-hover cursor-pointer">
                  {trip.coverImageUrl && (
                    <div
                      className="h-32 w-full rounded-t-xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
                    />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-100">{trip.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(trip.startDate)}
                    </p>
                    <Badge
                      variant={
                        trip.status === "ACTIVE"
                          ? "success"
                          : trip.status === "COMPLETED"
                          ? "secondary"
                          : "default"
                      }
                      className="mt-2"
                    >
                      {trip.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
