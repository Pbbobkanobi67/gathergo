import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { activityCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// POST /api/trips/[tripId]/activities - Create a new activity
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Get the user's trip member record
    const member = await getUserTripMember(user.id, tripId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not a member of this trip" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = activityCreateSchema.safeParse({ ...body, tripId });

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

    // If an itineraryDayId is provided, verify it belongs to this trip
    if (data.itineraryDayId) {
      const day = await prisma.itineraryDay.findFirst({
        where: { id: data.itineraryDayId, tripId },
      });

      if (!day) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Itinerary day not found for this trip" } },
          { status: 404 }
        );
      }
    }

    // If assignedToMemberId is provided, verify it belongs to this trip
    if (data.assignedToMemberId) {
      const assignee = await prisma.tripMember.findFirst({
        where: { id: data.assignedToMemberId, tripId },
      });

      if (!assignee) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Assigned member not found for this trip" } },
          { status: 404 }
        );
      }
    }

    const activity = await prisma.activity.create({
      data: {
        tripId,
        itineraryDayId: data.itineraryDayId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        category: data.category,
        reservationUrl: data.reservationUrl,
        confirmationCode: data.confirmationCode,
        cost: data.cost,
        paidBy: data.paidBy,
        assignedToMemberId: data.assignedToMemberId,
        createdByMemberId: member.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            guestName: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            guestName: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "ACTIVITY_ADDED",
      action: `added an activity: ${activity.title}`,
      entityType: "activity",
      entityId: activity.id,
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/activities error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create activity" } },
      { status: 500 }
    );
  }
}
