import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { generateInviteToken } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// POST /api/trips/[tripId]/invite - Regenerate invite token
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
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can regenerate invite links" } },
        { status: 403 }
      );
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        inviteToken: generateInviteToken(),
        inviteTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: {
        inviteToken: true,
      },
    });

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/invite error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to regenerate invite" } },
      { status: 500 }
    );
  }
}
