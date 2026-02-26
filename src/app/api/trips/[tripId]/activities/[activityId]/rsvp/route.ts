import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { activityRsvpSchema, activityRsvpResponseSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; activityId: string }>;
}

// GET /api/trips/[tripId]/activities/[activityId]/rsvp - Fetch RSVPs for an activity
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, activityId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rsvps = await prisma.activityRsvp.findMany({
      where: { activityId, activity: { tripId } },
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
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: rsvps });
  } catch (error) {
    console.error("GET rsvp error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch RSVPs" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/activities/[activityId]/rsvp - Send RSVP invites (bulk)
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tripId },
    });
    if (!activity) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Activity not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = activityRsvpSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const { memberIds } = validationResult.data;

    // Verify all members belong to this trip
    const members = await prisma.tripMember.findMany({
      where: { id: { in: memberIds }, tripId },
    });

    if (members.length !== memberIds.length) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Some members not found in this trip" } },
        { status: 400 }
      );
    }

    // Upsert RSVPs (skip existing ones, create new as INVITED)
    const existing = await prisma.activityRsvp.findMany({
      where: { activityId, memberId: { in: memberIds } },
      select: { memberId: true },
    });
    const existingSet = new Set(existing.map((r) => r.memberId));
    const newMemberIds = memberIds.filter((id) => !existingSet.has(id));

    if (newMemberIds.length > 0) {
      await prisma.activityRsvp.createMany({
        data: newMemberIds.map((memberId) => ({
          activityId,
          memberId,
          status: "INVITED" as const,
        })),
      });
    }

    // Remove RSVPs for members not in the new list
    await prisma.activityRsvp.deleteMany({
      where: { activityId, memberId: { notIn: memberIds } },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "ACTIVITY_RSVP_SENT",
      action: `sent RSVP invites for: ${activity.title}`,
      entityType: "activity",
      entityId: activityId,
    });

    // Return updated RSVPs
    const rsvps = await prisma.activityRsvp.findMany({
      where: { activityId },
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
    });

    return NextResponse.json({ success: true, data: rsvps }, { status: 201 });
  } catch (error) {
    console.error("POST rsvp error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to send RSVPs" } },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[tripId]/activities/[activityId]/rsvp - Respond to an RSVP
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

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      include: { user: { select: { name: true } } },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not a member of this trip" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = activityRsvpResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const rsvp = await prisma.activityRsvp.findUnique({
      where: { activityId_memberId: { activityId, memberId: member.id } },
      include: { activity: { select: { title: true } } },
    });

    if (!rsvp) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "You have not been invited to this activity" } },
        { status: 404 }
      );
    }

    const updated = await prisma.activityRsvp.update({
      where: { id: rsvp.id },
      data: { status: validationResult.data.status, respondedAt: new Date() },
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
    });

    const memberName = member.user?.name || member.guestName || "Someone";
    logActivity({
      tripId,
      userId: user.id,
      type: "ACTIVITY_RSVP_RESPONDED",
      action: `${memberName} ${validationResult.data.status.toLowerCase()} RSVP for: ${rsvp.activity.title}`,
      entityType: "activity",
      entityId: activityId,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH rsvp error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to respond to RSVP" } },
      { status: 500 }
    );
  }
}
