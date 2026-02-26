import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; mealId: string; recipeId: string }>;
}

const recipeInclude = {
  createdBy: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
};

// PATCH /api/trips/[tripId]/meals/[mealId]/recipes/[recipeId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId, recipeId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { mealNight: { select: { tripId: true } } },
    });

    if (!existing || existing.mealNightId !== mealId || existing.mealNight.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Recipe not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.servings !== undefined) updateData.servings = body.servings;
    if (body.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = body.prepTimeMinutes;
    if (body.cookTimeMinutes !== undefined) updateData.cookTimeMinutes = body.cookTimeMinutes;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl;
    if (body.ingredients !== undefined) updateData.ingredients = body.ingredients;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: updateData,
      include: recipeInclude,
    });

    return NextResponse.json({ success: true, data: recipe });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/meals/[mealId]/recipes/[recipeId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update recipe" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/meals/[mealId]/recipes/[recipeId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId, recipeId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { mealNight: { select: { tripId: true } } },
    });

    if (!existing || existing.mealNightId !== mealId || existing.mealNight.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Recipe not found" } },
        { status: 404 }
      );
    }

    await prisma.recipe.delete({ where: { id: recipeId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/meals/[mealId]/recipes/[recipeId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete recipe" } },
      { status: 500 }
    );
  }
}
