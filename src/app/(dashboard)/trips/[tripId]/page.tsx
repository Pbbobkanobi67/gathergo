"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Utensils,
  Wine,
  DollarSign,
  Package,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Trophy,
  Settings,
  Camera,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { AiAssistant } from "@/components/shared/AiAssistant";
import { useTrip } from "@/hooks/useTrip";
import { formatDate, getDaysUntil, generateVenmoDeepLink } from "@/lib/utils";
import { TRIP_TYPES } from "@/constants";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: trip, isLoading, error } = useTrip(tripId);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <LoadingPage message="Loading trip details..." />;
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-100">Trip not found</h2>
          <p className="mt-2 text-slate-400">This trip may have been deleted or you don&apos;t have access.</p>
          <Link href="/trips">
            <Button className="mt-4">Back to Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = TRIP_TYPES.find((t) => t.value === trip.type) ?? TRIP_TYPES[5];
  const daysUntil = getDaysUntil(trip.startDate);
  const isUpcoming = daysUntil > 0;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");
  const inviteLink = `${baseUrl}/join/${trip.inviteToken}`;
  const venmoHandle = process.env.NEXT_PUBLIC_ORGANIZER_VENMO_HANDLE || "BobSweigart";

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: trip.title,
      text: `Join me on ${trip.title}! ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`,
      url: inviteLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const googleMapsUrl = trip.latitude && trip.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${trip.latitude},${trip.longitude}`
    : trip.city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${trip.address ? trip.address + ", " : ""}${trip.city}, ${trip.state}`)}`
    : null;

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleMapsEmbedUrl = mapsApiKey
    ? trip.latitude && trip.longitude
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${trip.latitude},${trip.longitude}&zoom=13`
      : trip.city
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent(`${trip.address ? trip.address + ", " : ""}${trip.city}, ${trip.state}`)}&zoom=12`
      : null
    : null;

  const quickLinks = [
    { href: `/trips/${tripId}/itinerary`, icon: Calendar, label: "Itinerary", count: 0 },
    { href: `/trips/${tripId}/meals`, icon: Utensils, label: "Meals", count: trip._count?.mealNights || 0 },
    { href: `/trips/${tripId}/wine`, icon: Wine, label: "Wine", count: trip._count?.wineEvents || 0 },
    { href: `/trips/${tripId}/expenses`, icon: DollarSign, label: "Expenses", count: trip._count?.expenses || 0 },
    { href: `/trips/${tripId}/guests`, icon: Users, label: "Guests", count: trip._count?.members || 0 },
    { href: `/trips/${tripId}/packing`, icon: Package, label: "Packing", count: 0 },
    { href: `/trips/${tripId}/documents`, icon: FileText, label: "Docs", count: 0 },
    { href: `/trips/${tripId}/photos`, icon: Camera, label: "Photos", count: 0 },
    { href: `/trips/${tripId}/hood-bucks`, icon: Trophy, label: "Hood Bucks", count: 0 },
    { href: `/trips/${tripId}/settings`, icon: Settings, label: "Settings", count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        {trip.coverImageUrl ? (
          <div
            className="h-64 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          </div>
        ) : googleMapsEmbedUrl ? (
          <div className="relative h-64 w-full">
            <iframe
              className="h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={googleMapsEmbedUrl}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800">
            <span className="text-8xl">{typeInfo.icon}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="default">{typeInfo.label}</Badge>
                <Badge
                  variant={
                    trip.status === "ACTIVE"
                      ? "success"
                      : trip.status === "PLANNING"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {trip.status}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-200">
                <Calendar className="h-4 w-4" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </p>
              {trip.city && (
                <a
                  href={googleMapsUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-slate-300 hover:text-teal-300 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  {trip.address ? `${trip.address}, ` : ""}
                  {trip.city}, {trip.state}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </div>

            {isUpcoming && (
              <div className="text-right">
                <div className="rounded-xl bg-slate-900/80 px-4 py-3 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-amber-400">{daysUntil}</p>
                  <p className="text-sm text-slate-300">days to go</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={copyInviteLink} variant="outline" className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Invite Link"}
        </Button>
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        {trip.airbnbUrl && (
          <a href={trip.airbnbUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View Airbnb
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-teal-500 hover:bg-slate-800">
                      <link.icon className="h-6 w-6 text-teal-400" />
                      <span className="text-sm font-medium text-slate-200">{link.label}</span>
                      {link.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Airbnb Details */}
          {trip.airbnbConfirmationCode && (
            <Card>
              <CardHeader>
                <CardTitle>Accommodation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-pink-500/20 p-3">
                    <svg className="h-6 w-6 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.894c-.156.156-.41.25-.678.25-.27 0-.522-.094-.678-.25L12 12.356l-4.538 4.538c-.156.156-.41.25-.678.25-.27 0-.522-.094-.678-.25-.375-.375-.375-.98 0-1.355L10.644 11 6.106 6.462c-.375-.375-.375-.98 0-1.355.375-.375.98-.375 1.355 0L12 9.644l4.538-4.537c.375-.375.98-.375 1.355 0 .375.375.375.98 0 1.355L13.356 11l4.538 4.538c.375.376.375.98 0 1.356z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Confirmation Code</p>
                    <p className="font-mono text-lg font-semibold text-slate-100">
                      {trip.airbnbConfirmationCode}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Check-out: {formatDate(trip.endDate)} at 10:00 AM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venmo Payment Section */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <DollarSign className="h-5 w-5" />
                Help Cover the Airbnb Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-slate-300">
                Pay your share of the accommodation cost directly to the organizer via Venmo.
              </p>
              <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-800 p-6">
                <div className="h-40 w-40 rounded-xl bg-white p-2">
                  <Image
                    src={process.env.NEXT_PUBLIC_ORGANIZER_VENMO_QR_URL || "/Venmo QR.jpg"}
                    alt="Venmo QR Code"
                    width={160}
                    height={160}
                    className="h-full w-full rounded-lg object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-100">@{venmoHandle}</p>
                  <a
                    href={generateVenmoDeepLink(venmoHandle, 0, `${trip.title} - Accommodation`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="amber" className="mt-3 gap-2">
                      Pay via Venmo
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Google Maps */}
          {(trip.latitude && trip.longitude) || trip.city ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-teal-400" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.latitude && trip.longitude && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                  <div className="overflow-hidden rounded-lg">
                    <iframe
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${trip.latitude},${trip.longitude}&zoom=14`}
                    />
                  </div>
                ) : null}
                <a
                  href={
                    trip.latitude && trip.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${trip.latitude},${trip.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${trip.address ? trip.address + ", " : ""}${trip.city}, ${trip.state}`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                </a>
              </CardContent>
            </Card>
          ) : null}

          {/* Guests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Guests</CardTitle>
              <Badge variant="secondary">{trip.members?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              {trip.members && trip.members.length > 0 ? (
                <div className="space-y-4">
                  <AvatarStack
                    users={trip.members.map((m) => ({
                      name: m.user?.name || m.guestName || "Guest",
                      avatarUrl: m.user?.avatarUrl,
                    }))}
                    max={5}
                  />
                  <Link href={`/trips/${tripId}/guests`}>
                    <Button variant="outline" className="w-full">
                      Manage Guests
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-400">No guests yet</p>
                  <Button variant="outline" className="mt-3 w-full" onClick={copyInviteLink}>
                    Invite Guests
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Description */}
          {trip.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{trip.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <ActivityFeed tripId={tripId} />
        </div>
      </div>

      {/* AI Trip Assistant */}
      <AiAssistant tripId={tripId} />
    </div>
  );
}
