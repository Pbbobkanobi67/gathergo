import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { recipeCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; mealId: string }>;
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

// GET /api/trips/[tripId]/meals/[mealId]/recipes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const recipes = await prisma.recipe.findMany({
      where: { mealNightId: mealId, mealNight: { tripId } },
      include: recipeInclude,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: recipes });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/meals/[mealId]/recipes error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch recipes" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/meals/[mealId]/recipes
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, mealId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = recipeCreateSchema.safeParse({ ...body, mealNightId: mealId });

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
    const member = await getUserTripMember(user.id, tripId);

    const recipe = await prisma.recipe.create({
      data: {
        mealNightId: mealId,
        title: data.title,
        description: data.description,
        servings: data.servings,
        prepTimeMinutes: data.prepTimeMinutes,
        cookTimeMinutes: data.cookTimeMinutes,
        difficulty: data.difficulty,
        imageUrl: data.imageUrl,
        sourceUrl: data.sourceUrl,
        ingredients: data.ingredients,
        instructions: data.instructions,
        createdByMemberId: member?.id,
      },
      include: recipeInclude,
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "RECIPE_ADDED",
      action: `added a recipe: ${recipe.title}`,
      entityType: "recipe",
      entityId: recipe.id,
    });

    return NextResponse.json({ success: true, data: recipe }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/meals/[mealId]/recipes error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create recipe" } },
      { status: 500 }
    );
  }
}
