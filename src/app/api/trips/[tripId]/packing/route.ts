import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { packingItemCreateSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

const packingInclude = {
  claimedBy: {
    select: {
      id: true,
      guestName: true,
      role: true,
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  },
};

// GET /api/trips/[tripId]/packing
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

    const items = await prisma.packingItem.findMany({
      where: { tripId },
      include: packingInclude,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/packing error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch packing items" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/packing
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
    const validationResult = packingItemCreateSchema.safeParse({ ...body, tripId });

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

    const { name, category, quantity, forEveryone, notes } = validationResult.data;

    const item = await prisma.packingItem.create({
      data: { tripId, name, category, quantity, forEveryone, notes },
      include: packingInclude,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/packing error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create packing item" } },
      { status: 500 }
    );
  }
}
