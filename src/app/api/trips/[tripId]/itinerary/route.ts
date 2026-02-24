import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

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
            createdBy: {
              select: {
                id: true,
                guestName: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            assignedTo: {
              select: {
                id: true,
                guestName: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: { votes: true },
            },
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
