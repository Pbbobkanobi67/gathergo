import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; mealId: string }>;
}

// PATCH /api/trips/[tripId]/meals/[mealId] - Update a meal night
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existingMeal = await prisma.mealNight.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Meal not found" } },
        { status: 404 }
      );
    }

    if (existingMeal.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Meal not found in this trip" } },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Build the update data, only including fields that are present
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.mealType !== undefined) updateData.mealType = body.mealType;
    if (body.servings !== undefined) updateData.servings = body.servings;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.assignedCoupleName !== undefined) updateData.assignedCoupleName = body.assignedCoupleName;

    // Handle assignment changes
    if (body.assignedToMemberId !== undefined) {
      updateData.assignedToMemberId = body.assignedToMemberId;
      // Auto-update status based on assignment
      if (body.assignedToMemberId && !body.status) {
        updateData.status = "ASSIGNED";
      } else if (!body.assignedToMemberId && !body.status) {
        updateData.status = "UNASSIGNED";
      }
    }

    // Allow explicit status override
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const meal = await prisma.mealNight.update({
      where: { id: mealId },
      data: updateData,
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
      },
    });

    return NextResponse.json({ success: true, data: meal });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/meals/[mealId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update meal" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/meals/[mealId] - Delete a meal night (organizer only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId } = await params;
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
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can delete meals" } },
        { status: 403 }
      );
    }

    const meal = await prisma.mealNight.findUnique({
      where: { id: mealId },
    });

    if (!meal) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Meal not found" } },
        { status: 404 }
      );
    }

    if (meal.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Meal not found in this trip" } },
        { status: 404 }
      );
    }

    await prisma.mealNight.delete({
      where: { id: mealId },
    });

    return NextResponse.json({ success: true, data: { id: mealId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/meals/[mealId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete meal" } },
      { status: 500 }
    );
  }
}
