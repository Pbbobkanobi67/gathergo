"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, MapPin, Users, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, LoadingPage } from "@/components/shared/LoadingSpinner";
import { guestJoinSchema, type GuestJoinInput } from "@/lib/validations";
import { formatDate } from "@/lib/utils";
import { TRIP_TYPES } from "@/constants";

interface TripInfo {
  id: string;
  title: string;
  type: string;
  description: string | null;
  startDate: string;
  endDate: string;
  city: string | null;
  state: string | null;
  coverImageUrl: string | null;
  organizer: {
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    members: number;
  };
}

export default function GuestJoinPage() {
  const params = useParams();
  const router = useRouter();
  const inviteToken = params.inviteToken as string;

  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showCoupleField, setShowCoupleField] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<GuestJoinInput>({
    resolver: zodResolver(guestJoinSchema),
    defaultValues: {
      isCouple: false,
    },
  });

  const isCouple = watch("isCouple");

  useEffect(() => {
    if (isCouple !== showCoupleField) {
      setShowCoupleField(isCouple);
    }
  }, [isCouple, showCoupleField]);

  useEffect(() => {
    async function fetchTripInfo() {
      try {
        const res = await fetch(`/api/guest/join/${inviteToken}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error?.message || "Failed to load trip info");
          return;
        }

        setTripInfo(data.data);
      } catch {
        setError("Failed to load trip info");
      } finally {
        setLoading(false);
      }
    }

    fetchTripInfo();
  }, [inviteToken]);

  const onSubmit = async (formData: GuestJoinInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/guest/join/${inviteToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to join trip");
        return;
      }

      // Store guest token in localStorage as backup
      if (data.data.guestToken) {
        localStorage.setItem("guestToken", data.data.guestToken);
        localStorage.setItem("guestTripId", data.data.tripId);
      }

      setJoined(true);

      // Redirect to trip page after a brief delay
      setTimeout(() => {
        router.push(`/trip/${data.data.tripId}`);
      }, 2000);
    } catch {
      setError("Failed to join trip");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading trip details..." />;
  }

  if (error && !tripInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-slate-100">
              Unable to Join
            </h2>
            <p className="mt-2 text-center text-slate-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="rounded-full bg-green-500/20 p-4">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-100">
              You&apos;re In!
            </h2>
            <p className="mt-2 text-center text-slate-400">
              You&apos;ve successfully joined {tripInfo?.title}. Redirecting...
            </p>
            <LoadingSpinner className="mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeInfo = TRIP_TYPES.find((t) => t.value === tripInfo?.type) ?? TRIP_TYPES[5];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero */}
      <div className="relative">
        {tripInfo?.coverImageUrl ? (
          <div
            className="h-64 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${tripInfo.coverImageUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800">
            <span className="text-8xl">{typeInfo.icon}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant="default" className="mb-2">
            {typeInfo.label}
          </Badge>
          <h1 className="text-3xl font-bold text-white">{tripInfo?.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl p-6">
        {/* Trip Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <p className="flex items-center gap-2 text-slate-300">
                  <Calendar className="h-5 w-5 text-teal-400" />
                  {formatDate(tripInfo?.startDate || "")} - {formatDate(tripInfo?.endDate || "")}
                </p>
                {tripInfo?.city && (
                  <p className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-5 w-5 text-teal-400" />
                    {tripInfo.city}, {tripInfo.state}
                  </p>
                )}
                <p className="flex items-center gap-2 text-slate-300">
                  <Users className="h-5 w-5 text-teal-400" />
                  {tripInfo?._count.members} guests joined
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Organized by</p>
                <p className="font-semibold text-slate-100">
                  {tripInfo?.organizer.name}
                </p>
              </div>
            </div>
            {tripInfo?.description && (
              <p className="mt-4 text-slate-400">{tripInfo.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Join Form */}
        <Card>
          <CardHeader>
            <CardTitle>Join This Trip</CardTitle>
            <CardDescription>
              Fill in your details to RSVP and get access to the trip planning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Your Name *
                </label>
                <Input
                  {...register("name")}
                  placeholder="Enter your full name"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Email Address *
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="(555) 123-4567"
                  error={errors.phone?.message}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register("isCouple")}
                  id="isCouple"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
                />
                <label htmlFor="isCouple" className="text-sm text-slate-300">
                  I&apos;m attending as a couple
                </label>
              </div>

              {showCoupleField && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Partner&apos;s Name
                  </label>
                  <Input
                    {...register("couplePartnerName")}
                    placeholder="Enter your partner's name"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Dietary Restrictions
                </label>
                <Input
                  {...register("dietaryRestrictions")}
                  placeholder="e.g., Vegetarian, Gluten-free"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Allergies
                </label>
                <Input
                  {...register("allergies")}
                  placeholder="e.g., Peanuts, Shellfish"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Notes for the Organizer
                </label>
                <textarea
                  {...register("notes")}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  rows={3}
                  placeholder="Any special requests or notes..."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={submitting}
              >
                {submitting ? "Joining..." : "Join Trip"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
