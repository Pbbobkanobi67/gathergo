import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { shoppingItemCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

const shoppingInclude = {
  assignedTo: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
  purchasedBy: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
  mealNight: {
    select: { id: true, title: true, mealType: true, date: true },
  },
};

// GET /api/trips/[tripId]/shopping
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

    const items = await prisma.shoppingItem.findMany({
      where: { tripId },
      include: shoppingInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/shopping error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch shopping items" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/shopping
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
    const validationResult = shoppingItemCreateSchema.safeParse({ ...body, tripId });

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

    const item = await prisma.shoppingItem.create({
      data: {
        tripId,
        mealNightId: data.mealNightId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        estimatedCost: data.estimatedCost,
        assignedToMemberId: data.assignedToMemberId,
        notes: data.notes,
      },
      include: shoppingInclude,
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "MEAL_UPDATED",
      action: `added a grocery item: ${item.name}`,
      entityType: "shoppingItem",
      entityId: item.id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/shopping error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create shopping item" } },
      { status: 500 }
    );
  }
}
