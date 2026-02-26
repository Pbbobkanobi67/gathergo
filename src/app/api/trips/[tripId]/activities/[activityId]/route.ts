import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { activityCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; activityId: string }>;
}

const activityInclude = {
  createdBy: {
    select: {
      id: true,
      guestName: true,
      role: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  assignedTo: {
    select: {
      id: true,
      guestName: true,
      role: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  rsvps: {
    include: {
      member: {
        select: {
          id: true,
          guestName: true,
          role: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  },
  linkedMeal: { select: { id: true, title: true, mealType: true, date: true } },
  linkedWineEvent: { select: { id: true, title: true, date: true } },
  _count: { select: { votes: true } },
} as const;

// PATCH /api/trips/[tripId]/activities/[activityId] - Update an activity
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, activityId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const member = await getUserTripMember(user.id, tripId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not a member of this trip" } },
        { status: 403 }
      );
    }

    const existingActivity = await prisma.activity.findFirst({
      where: { id: activityId, tripId },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Activity not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const partialSchema = activityCreateSchema.partial().omit({ tripId: true });
    const validationResult = partialSchema.safeParse(body);

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

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data,
      include: activityInclude,
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "ACTIVITY_UPDATED",
      action: `updated activity: ${activity.title}`,
      entityType: "activity",
      entityId: activity.id,
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/activities/[activityId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update activity" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/activities/[activityId] - Delete an activity (organizer only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, activityId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can delete activities" } },
        { status: 403 }
      );
    }

    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tripId },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Activity not found" } },
        { status: 404 }
      );
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });

    return NextResponse.json({ success: true, data: { id: activityId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/activities/[activityId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete activity" } },
      { status: 500 }
    );
  }
}
