import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { bagAssignmentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/assign-bags
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
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
        { success: false, error: { code: "FORBIDDEN", message: "Only the organizer can assign bag numbers" } },
        { status: 403 }
      );
    }

    const event = await prisma.wineEvent.findUnique({
      where: { id: eventId },
      select: { tripId: true, status: true },
    });

    if (!event || event.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    if (event.status !== "SCORING") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Bag numbers can only be assigned during SCORING phase" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = bagAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const { assignments } = validationResult.data;

    // Check for duplicate bag numbers
    const bagNumbers = assignments.map((a) => a.bagNumber);
    if (new Set(bagNumbers).size !== bagNumbers.length) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Duplicate bag numbers are not allowed" } },
        { status: 400 }
      );
    }

    // Verify all entries belong to this event
    const entryIds = assignments.map((a) => a.entryId);
    const entries = await prisma.wineEntry.findMany({
      where: { id: { in: entryIds }, wineEventId: eventId },
      select: { id: true },
    });

    if (entries.length !== entryIds.length) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Some entries do not belong to this event" } },
        { status: 400 }
      );
    }

    // Update all entries in a transaction
    await prisma.$transaction(
      assignments.map((a) =>
        prisma.wineEntry.update({
          where: { id: a.entryId },
          data: { bagNumber: a.bagNumber },
        })
      )
    );

    return NextResponse.json({ success: true, data: { assigned: assignments.length } });
  } catch (error) {
    console.error("POST assign-bags error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to assign bag numbers" } },
      { status: 500 }
    );
  }
}
