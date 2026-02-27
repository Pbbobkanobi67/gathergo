import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineEntryCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/entries
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

    // Verify event exists and is in OPEN status
    const event = await prisma.wineEvent.findUnique({
      where: { id: eventId },
      select: { tripId: true, status: true, entriesPerPerson: true },
    });

    if (!event || event.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    if (event.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Event is not accepting entries" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = wineEntryCreateSchema.safeParse({ ...body, wineEventId: eventId });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      select: { id: true },
    });

    // Enforce entries-per-person limit
    if (member) {
      const existingCount = await prisma.wineEntry.count({
        where: { wineEventId: eventId, submittedByMemberId: member.id },
      });

      if (existingCount >= event.entriesPerPerson) {
        return NextResponse.json(
          { success: false, error: { code: "LIMIT_REACHED", message: `You can only submit ${event.entriesPerPerson} entries` } },
          { status: 400 }
        );
      }
    }

    const { wineName, winery, vintage, varietal, price, imageUrl, notes } = validationResult.data;

    const entry = await prisma.wineEntry.create({
      data: {
        wineEventId: eventId,
        bagNumber: null,
        wineName,
        winery,
        vintage,
        varietal,
        price,
        imageUrl,
        notes,
        submittedByMemberId: member?.id,
      },
      include: {
        submittedBy: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "WINE_ENTRY_SUBMITTED",
      action: `submitted a tasting entry: ${entry.wineName}`,
      entityType: "wineEntry",
      entityId: entry.id,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error("POST wine entry error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create wine entry" } },
      { status: 500 }
    );
  }
}
