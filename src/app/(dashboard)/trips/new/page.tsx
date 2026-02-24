"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Info,
  Home,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTrip } from "@/hooks/useTrip";
import { tripCreateSchema } from "@/lib/validations";
import { TRIP_TYPES, US_TIMEZONES } from "@/constants";
import type { TripFormData } from "@/types";

const steps = [
  { id: "basics", label: "Basics", icon: Info },
  { id: "location", label: "Location", icon: MapPin },
  { id: "details", label: "Details", icon: Home },
];

export default function NewTripPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const createTrip = useCreateTrip();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<TripFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tripCreateSchema) as any,
    defaultValues: {
      type: "CABIN",
      timezone: "America/Los_Angeles",
    },
  });

  const watchedType = watch("type");
  const selectedType = TRIP_TYPES.find((t) => t.value === watchedType);

  const validateStep = async () => {
    let fieldsToValidate: (keyof TripFormData)[] = [];
    switch (currentStep) {
      case 0:
        fieldsToValidate = ["title", "type", "startDate", "endDate"];
        break;
      case 1:
        fieldsToValidate = ["city", "state"];
        break;
      case 2:
        fieldsToValidate = [];
        break;
    }
    if (fieldsToValidate.length === 0) return true;
    return await trigger(fieldsToValidate);
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: TripFormData) => {
    try {
      const trip = await createTrip.mutateAsync(data);
      router.push(`/trips/${trip.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  const tripTypeOptions = TRIP_TYPES.map((t) => ({
    value: t.value,
    label: `${t.icon} ${t.label}`,
  }));

  const timezoneOptions = US_TIMEZONES.map((tz) => ({
    value: tz.value,
    label: tz.label,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/trips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Create a Trip</h1>
          <p className="text-sm text-slate-400">Plan your next adventure</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                index === currentStep
                  ? "bg-teal-600 text-white"
                  : index < currentStep
                  ? "bg-teal-600/20 text-teal-400 cursor-pointer"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`h-px w-8 ${
                  index < currentStep ? "bg-teal-500" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basics */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-teal-400" />
                Trip Basics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" required>Trip Name</Label>
                <Input
                  id="title"
                  placeholder="e.g., Lake Tahoe Cabin Weekend"
                  error={errors.title?.message}
                  {...register("title")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" required>Trip Type</Label>
                <Select
                  id="type"
                  options={tripTypeOptions}
                  error={errors.type?.message}
                  {...register("type")}
                />
                {selectedType && (
                  <p className="text-xs text-slate-400">{selectedType.description}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" required>Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="startDate"
                      type="date"
                      className="pl-10"
                      error={errors.startDate?.message}
                      {...register("startDate")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" required>End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="endDate"
                      type="date"
                      className="pl-10"
                      error={errors.endDate?.message}
                      {...register("endDate")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  options={timezoneOptions}
                  error={errors.timezone?.message}
                  {...register("timezone")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-400" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Mountain View Dr"
                  error={errors.address?.message}
                  {...register("address")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., South Lake Tahoe"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., California"
                    error={errors.state?.message}
                    {...register("state")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  defaultValue="United States"
                  error={errors.country?.message}
                  {...register("country")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-teal-400" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your guests what to expect on this trip..."
                  rows={4}
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  placeholder="https://example.com/image.jpg"
                  error={errors.coverImageUrl?.message}
                  {...register("coverImageUrl")}
                />
                <p className="text-xs text-slate-400">
                  Paste a URL to an image for the trip cover
                </p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <h4 className="mb-3 text-sm font-medium text-slate-200">
                  Airbnb / Accommodation (Optional)
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="airbnbConfirmationCode">Confirmation Code</Label>
                    <Input
                      id="airbnbConfirmationCode"
                      placeholder="e.g., HMABCXYZ12"
                      error={errors.airbnbConfirmationCode?.message}
                      {...register("airbnbConfirmationCode")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="airbnbUrl">Listing URL</Label>
                    <Input
                      id="airbnbUrl"
                      placeholder="https://airbnb.com/rooms/..."
                      error={errors.airbnbUrl?.message}
                      {...register("airbnbUrl")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={createTrip.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Create Trip
            </Button>
          )}
        </div>

        {/* Error Message */}
        {createTrip.isError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              Failed to create trip. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
