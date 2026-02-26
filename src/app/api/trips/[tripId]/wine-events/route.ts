import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineEventCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/wine-events - List all wine events for a trip
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

    const wineEvents = await prisma.wineEvent.findMany({
      where: { tripId },
      include: {
        _count: {
          select: {
            entries: true,
            scores: true,
            bets: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, data: wineEvents });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/wine-events error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch wine events" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/wine-events - Create a new wine event
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

    const body = await request.json();
    const validationResult = wineEventCreateSchema.safeParse({ ...body, tripId });

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

    const wineEvent = await prisma.wineEvent.create({
      data: {
        tripId: data.tripId,
        title: data.title,
        date: data.date,
        priceRangeMin: data.priceRangeMin,
        priceRangeMax: data.priceRangeMax,
        hoodBucksPotSize: data.hoodBucksPotSize,
        allowCashBets: data.allowCashBets,
      },
      include: {
        _count: {
          select: {
            entries: true,
            scores: true,
            bets: true,
          },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "WINE_EVENT_CREATED",
      action: `created wine event: ${wineEvent.title}`,
      entityType: "wineEvent",
      entityId: wineEvent.id,
    });

    // Auto-create linked itinerary activity
    try {
      const eventDate = new Date(data.date);
      const matchingDay = await prisma.itineraryDay.findFirst({
        where: {
          tripId,
          date: {
            gte: new Date(eventDate.toISOString().slice(0, 10) + "T00:00:00Z"),
            lt: new Date(eventDate.toISOString().slice(0, 10) + "T23:59:59Z"),
          },
        },
      });
      if (matchingDay) {
        const member = await getUserTripMember(user.id, tripId);
        const startTime = new Date(eventDate);
        startTime.setUTCHours(19, 0, 0, 0);
        await prisma.activity.create({
          data: {
            tripId,
            itineraryDayId: matchingDay.id,
            title: wineEvent.title,
            category: "DINING",
            startTime,
            linkedWineEventId: wineEvent.id,
            createdByMemberId: member?.id,
          },
        });
      }
    } catch (e) {
      console.error("Auto-sync wine event to itinerary failed:", e);
    }

    return NextResponse.json({ success: true, data: wineEvent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/wine-events error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create wine event" } },
      { status: 500 }
    );
  }
}
