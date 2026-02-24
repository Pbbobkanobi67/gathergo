"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Bell,
  BellOff,
  Globe,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTrip, useUpdateTrip, useDeleteTrip } from "@/hooks/useTrip";
import { US_TIMEZONES, TRIP_TYPES, TRIP_STATUSES, DEFAULT_NOTIFICATION_PREFS } from "@/constants";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const { data: trip, isLoading } = useTrip(tripId);
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [tripSettings, setTripSettings] = useState({
    timezone: "America/Los_Angeles",
    type: "VACATION",
    status: "PLANNING",
  });

  useEffect(() => {
    if (trip) {
      setTripSettings({
        timezone: trip.timezone || "America/Los_Angeles",
        type: trip.type || "VACATION",
        status: trip.status || "PLANNING",
      });
    }
  }, [trip]);

  if (isLoading) {
    return <LoadingPage message="Loading settings..." />;
  }

  if (!trip) return null;

  const handleSaveTripSettings = async () => {
    await updateTrip.mutateAsync({
      tripId,
      data: {
        timezone: tripSettings.timezone,
        type: tripSettings.type,
      } as Record<string, unknown> as Partial<typeof tripSettings>,
    });
  };

  const handleDelete = async () => {
    if (deleteConfirm !== trip.title) return;
    try {
      await deleteTrip.mutateAsync(tripId);
      router.push("/trips");
    } catch {
      // Error on deleteTrip.error
    }
  };

  const timezoneOptions = US_TIMEZONES.map((tz) => ({
    value: tz.value,
    label: tz.label,
  }));

  const typeOptions = TRIP_TYPES.map((t) => ({
    value: t.value,
    label: `${t.icon} ${t.label}`,
  }));

  const statusOptions = TRIP_STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const notifItems = [
    { key: "tripUpdates" as const, label: "Trip Updates", desc: "Changes to trip details, dates, or location" },
    { key: "mealChanges" as const, label: "Meal Changes", desc: "Meal assignments, menu updates" },
    { key: "activityVotes" as const, label: "Activity Votes", desc: "New activities and voting results" },
    { key: "wineContest" as const, label: "Wine Events", desc: "Wine tasting status changes and results" },
    { key: "expenseUpdates" as const, label: "Expenses", desc: "New expenses and settlement requests" },
    { key: "announcements" as const, label: "Announcements", desc: "Important messages from the organizer" },
    { key: "chat" as const, label: "Chat Messages", desc: "New messages in trip chat" },
  ];

  const deliveryItems = [
    { key: "notifyViaEmail" as const, label: "Email Notifications", desc: "Receive updates via email" },
    { key: "notifyViaSms" as const, label: "SMS Notifications", desc: "Receive updates via text message" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/trips/${tripId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-400">{trip.title}</p>
        </div>
      </div>

      {/* Trip Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-teal-400" />
            Trip Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                options={timezoneOptions}
                value={tripSettings.timezone}
                onChange={(e) =>
                  setTripSettings({ ...tripSettings, timezone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-type">Trip Type</Label>
              <Select
                id="trip-type"
                options={typeOptions}
                value={tripSettings.type}
                onChange={(e) =>
                  setTripSettings({ ...tripSettings, type: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-status">Trip Status</Label>
            <Select
              id="trip-status"
              options={statusOptions}
              value={tripSettings.status}
              onChange={(e) =>
                setTripSettings({ ...tripSettings, status: e.target.value })
              }
            />
          </div>

          <Button
            onClick={handleSaveTripSettings}
            isLoading={updateTrip.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-amber-400" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Choose which notifications you want to receive for this trip.
          </p>

          <div className="space-y-3">
            {notifItems.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3 transition-colors hover:border-slate-600"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={(e) =>
                    setNotifPrefs({
                      ...notifPrefs,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                />
              </label>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-300">
              Delivery Method
            </p>
            <div className="space-y-3">
              {deliveryItems.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3 transition-colors hover:border-slate-600"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={(e) =>
                      setNotifPrefs({
                        ...notifPrefs,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Delete Trip</p>
              <p className="text-sm text-slate-400">
                Permanently delete this trip and all its data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Trip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Trip</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{trip.title}&quot; and all associated
              data including members, itineraries, meals, expenses, and wine
              events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <strong className="text-red-400">{trip.title}</strong> to
                confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={trip.title}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              isLoading={deleteTrip.isPending}
              disabled={deleteConfirm !== trip.title}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
