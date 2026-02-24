import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; itemId: string }>;
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

// PATCH /api/trips/[tripId]/packing/[itemId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, itemId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const item = await prisma.packingItem.update({
      where: { id: itemId, tripId },
      data: body,
      include: packingInclude,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/packing/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update packing item" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/packing/[itemId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, itemId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    await prisma.packingItem.delete({
      where: { id: itemId, tripId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/packing/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete packing item" } },
      { status: 500 }
    );
  }
}
