import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

const MEAL_DEFAULT_HOURS: Record<string, number> = {
  BREAKFAST: 8,
  LUNCH: 12,
  DINNER: 18,
  SNACKS: 15,
};

// POST /api/trips/[tripId]/activities/sync - Sync meals/wine events to itinerary
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

    const member = await getUserTripMember(user.id, tripId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not a member of this trip" } },
        { status: 403 }
      );
    }

    // Get all meals that don't have a linked activity yet
    const unlinkedMeals = await prisma.mealNight.findMany({
      where: {
        tripId,
        linkedActivities: { none: {} },
      },
    });

    // Get all wine events that don't have a linked activity yet
    const unlinkedWineEvents = await prisma.wineEvent.findMany({
      where: {
        tripId,
        linkedActivities: { none: {} },
      },
    });

    // Get all itinerary days for date matching
    const days = await prisma.itineraryDay.findMany({
      where: { tripId },
      orderBy: { date: "asc" },
    });

    const created: string[] = [];

    // Create activities for unlinked meals
    for (const meal of unlinkedMeals) {
      const mealDate = new Date(meal.date);
      const matchingDay = days.find((d) => {
        const dayDate = new Date(d.date);
        return dayDate.toISOString().slice(0, 10) === mealDate.toISOString().slice(0, 10);
      });

      if (!matchingDay) continue;

      const hour = MEAL_DEFAULT_HOURS[meal.mealType] ?? 12;
      const startTime = new Date(mealDate);
      startTime.setUTCHours(hour, 0, 0, 0);

      await prisma.activity.create({
        data: {
          tripId,
          itineraryDayId: matchingDay.id,
          title: meal.title || `${meal.mealType.charAt(0) + meal.mealType.slice(1).toLowerCase()}`,
          category: "MEALS",
          startTime,
          linkedMealId: meal.id,
          createdByMemberId: member.id,
        },
      });
      created.push(`Meal: ${meal.title || meal.mealType}`);
    }

    // Create activities for unlinked wine events
    for (const event of unlinkedWineEvents) {
      const eventDate = new Date(event.date);
      const matchingDay = days.find((d) => {
        const dayDate = new Date(d.date);
        return dayDate.toISOString().slice(0, 10) === eventDate.toISOString().slice(0, 10);
      });

      if (!matchingDay) continue;

      const startTime = new Date(eventDate);
      startTime.setUTCHours(19, 0, 0, 0); // Default 7pm for wine events

      await prisma.activity.create({
        data: {
          tripId,
          itineraryDayId: matchingDay.id,
          title: event.title,
          category: "DINING",
          startTime,
          linkedWineEventId: event.id,
          createdByMemberId: member.id,
        },
      });
      created.push(`Wine: ${event.title}`);
    }

    return NextResponse.json({
      success: true,
      data: { created, count: created.length },
    });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/activities/sync error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to sync activities" } },
      { status: 500 }
    );
  }
}
