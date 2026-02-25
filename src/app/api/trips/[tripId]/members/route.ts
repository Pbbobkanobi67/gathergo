import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/members - List all members of a trip
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

    const members = await prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            venmoHandle: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/members error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch members" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/members - Add a member to a trip (organizer only)
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

    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can add members" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { guestName, guestEmail, guestPhone, role = "GUEST" } = body;

    if (!guestName || !guestEmail) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name and email are required" } },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existing = await prisma.tripMember.findFirst({
      where: { tripId, guestEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "This person is already a member" } },
        { status: 409 }
      );
    }

    const member = await prisma.tripMember.create({
      data: {
        tripId,
        guestName,
        guestEmail,
        guestPhone,
        role,
        rsvpStatus: "PENDING",
      },
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

    logActivity({
      tripId,
      userId: user.id,
      type: "MEMBER_JOINED",
      action: `added ${member.guestName || "a guest"} to the trip`,
      entityType: "member",
      entityId: member.id,
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/members error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to add member" } },
      { status: 500 }
    );
  }
}
