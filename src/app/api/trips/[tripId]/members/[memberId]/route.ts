import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { memberUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; memberId: string }>;
}

// PATCH /api/trips/[tripId]/members/[memberId] - Update a member
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, memberId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Check if user is organizer or the member themselves
    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    const targetMember = await prisma.tripMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 }
      );
    }

    const isSelf = targetMember.userId === user.id;
    if (!isOrganizer && !isSelf) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = memberUpdateSchema.safeParse(body);

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

    // Only organizers can change roles
    const data = validationResult.data;
    if (data.role && !isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can change roles" } },
        { status: 403 }
      );
    }

    const member = await prisma.tripMember.update({
      where: { id: memberId },
      data,
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
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/members/[memberId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update member" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/members/[memberId] - Remove a member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, memberId } = await params;
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
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can remove members" } },
        { status: 403 }
      );
    }

    // Don't allow removing the organizer
    const member = await prisma.tripMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 }
      );
    }

    if (member.role === "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot remove the trip organizer" } },
        { status: 403 }
      );
    }

    await prisma.tripMember.delete({
      where: { id: memberId },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "MEMBER_LEFT",
      action: `removed ${member.guestName || "a member"} from the trip`,
      entityType: "member",
      entityId: memberId,
    });

    return NextResponse.json({ success: true, data: { id: memberId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/members/[memberId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to remove member" } },
      { status: 500 }
    );
  }
}
