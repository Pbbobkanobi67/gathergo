import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { tripUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId] - Get trip details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            venmoHandle: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            members: true,
            itineraryDays: true,
            mealNights: true,
            wineEvents: true,
            expenses: true,
            documents: true,
            photos: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Trip not found" } },
        { status: 404 }
      );
    }

    // Check if user has access to this trip
    const isOrganizer = trip.organizerId === user.id;
    const isMember = trip.members.some((m) => m.userId === user.id);

    if (!isOrganizer && !isMember) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You don't have access to this trip" } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("GET /api/trips/[tripId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch trip" } },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[tripId] - Update trip
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Check if user is the organizer
    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the organizer can update the trip" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = tripUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Normalize dates to noon UTC to prevent timezone display shifts
    if (data.startDate) { data.startDate.setUTCHours(12, 0, 0, 0); }
    if (data.endDate) { data.endDate.setUTCHours(12, 0, 0, 0); }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            mealNights: true,
            wineEvents: true,
            expenses: true,
          },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "TRIP_UPDATED",
      action: `updated the trip`,
      entityType: "trip",
      entityId: tripId,
    });

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update trip" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId] - Delete trip
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Check if user is the organizer
    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the organizer can delete the trip" } },
        { status: 403 }
      );
    }

    // Soft delete by setting status to CANCELLED
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, data: { id: tripId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete trip" } },
      { status: 500 }
    );
  }
}
