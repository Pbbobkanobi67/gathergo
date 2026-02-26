import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { mealNightCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

const MEAL_DEFAULT_HOURS: Record<string, number> = {
  BREAKFAST: 8,
  LUNCH: 12,
  DINNER: 18,
  SNACKS: 15,
};

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/meals - List all meal nights for a trip
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

    const meals = await prisma.mealNight.findMany({
      where: { tripId },
      include: {
        recipes: {
          include: {
            createdBy: {
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
            },
          },
          orderBy: { createdAt: "asc" },
        },
        assignedTo: {
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
        },
        shoppingItems: {
          include: {
            assignedTo: {
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
            },
          },
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [
        { date: "asc" },
        { mealType: "asc" },
      ],
    });

    return NextResponse.json({ success: true, data: meals });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/meals error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch meals" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/meals - Create a new meal night
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
    const validationResult = mealNightCreateSchema.safeParse({ ...body, tripId });

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

    // Check for duplicate meal (same trip, date, and meal type)
    const existing = await prisma.mealNight.findUnique({
      where: {
        tripId_date_mealType: {
          tripId,
          date: data.date,
          mealType: data.mealType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "A meal of this type already exists for this date" } },
        { status: 409 }
      );
    }

    // Determine status based on assignment
    const status = data.assignedToMemberId ? "ASSIGNED" : "UNASSIGNED";

    const meal = await prisma.mealNight.create({
      data: {
        tripId,
        date: data.date,
        mealType: data.mealType,
        title: data.title,
        description: data.description,
        assignedToMemberId: data.assignedToMemberId,
        assignedCoupleName: data.assignedCoupleName,
        status,
        servings: data.servings,
        notes: data.notes,
      },
      include: {
        recipes: true,
        assignedTo: {
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
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "MEAL_CREATED",
      action: `created a meal: ${meal.title || meal.mealType}`,
      entityType: "meal",
      entityId: meal.id,
    });

    // Auto-create linked itinerary activity
    try {
      const mealDate = new Date(data.date);
      const matchingDay = await prisma.itineraryDay.findFirst({
        where: {
          tripId,
          date: {
            gte: new Date(mealDate.toISOString().slice(0, 10) + "T00:00:00Z"),
            lt: new Date(mealDate.toISOString().slice(0, 10) + "T23:59:59Z"),
          },
        },
      });
      if (matchingDay) {
        const member = await getUserTripMember(user.id, tripId);
        const hour = MEAL_DEFAULT_HOURS[data.mealType] ?? 12;
        const startTime = new Date(mealDate);
        startTime.setUTCHours(hour, 0, 0, 0);
        await prisma.activity.create({
          data: {
            tripId,
            itineraryDayId: matchingDay.id,
            title: meal.title || `${data.mealType.charAt(0) + data.mealType.slice(1).toLowerCase()}`,
            category: "MEALS",
            startTime,
            linkedMealId: meal.id,
            createdByMemberId: member?.id,
          },
        });
      }
    } catch (e) {
      console.error("Auto-sync meal to itinerary failed:", e);
    }

    return NextResponse.json({ success: true, data: meal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/meals error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create meal" } },
      { status: 500 }
    );
  }
}
