import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { tripCreateSchema } from "@/lib/validations";
import { generateInviteToken, getDateRange } from "@/lib/utils";

// GET /api/trips - List all trips for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { organizerId: user.id },
          {
            members: {
              some: { userId: user.id },
            },
          },
        ],
      },
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
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch trips" } },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = tripCreateSchema.safeParse(body);

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

    // Create the trip with a unique invite token
    const trip = await prisma.trip.create({
      data: {
        ...data,
        organizerId: user.id,
        inviteToken: generateInviteToken(),
        inviteTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Add the organizer as a trip member
    await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        guestName: user.name,
        guestEmail: user.email,
        role: "ORGANIZER",
        rsvpStatus: "CONFIRMED",
        joinedAt: new Date(),
      },
    });

    // Create itinerary days for each day of the trip
    const tripDays = getDateRange(trip.startDate, trip.endDate);
    await prisma.itineraryDay.createMany({
      data: tripDays.map((date, index) => ({
        tripId: trip.id,
        date,
        title: index === 0 ? "Arrival Day" : index === tripDays.length - 1 ? "Departure Day" : `Day ${index + 1}`,
      })),
    });

    // Create default meal nights for each day (dinner only)
    await prisma.mealNight.createMany({
      data: tripDays.slice(0, -1).map((date) => ({
        tripId: trip.id,
        date,
        mealType: "DINNER",
        status: "UNASSIGNED",
      })),
    });

    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create trip" } },
      { status: 500 }
    );
  }
}
