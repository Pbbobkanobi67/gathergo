import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

const memberSelect = {
  id: true,
  guestName: true,
  role: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

// GET /api/trips/[tripId]/itinerary - List itinerary days with activities
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

    const itineraryDays = await prisma.itineraryDay.findMany({
      where: { tripId },
      include: {
        activities: {
          include: {
            createdBy: { select: memberSelect },
            assignedTo: { select: memberSelect },
            rsvps: {
              include: {
                member: { select: memberSelect },
              },
            },
            linkedMeal: { select: { id: true, title: true, mealType: true, date: true } },
            linkedWineEvent: { select: { id: true, title: true, date: true } },
            _count: { select: { votes: true } },
          },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, data: itineraryDays });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/itinerary error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch itinerary" } },
      { status: 500 }
    );
  }
}
