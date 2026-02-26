import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string; entryId: string }>;
}

const entryInclude = {
  submittedBy: {
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
};

// PATCH /api/trips/[tripId]/wine-events/[eventId]/entries/[entryId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId, entryId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existing = await prisma.wineEntry.findUnique({
      where: { id: entryId },
      include: { wineEvent: { select: { tripId: true } } },
    });

    if (!existing || existing.wineEventId !== eventId || existing.wineEvent.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine entry not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.wineName !== undefined) updateData.wineName = body.wineName;
    if (body.winery !== undefined) updateData.winery = body.winery;
    if (body.vintage !== undefined) updateData.vintage = body.vintage;
    if (body.varietal !== undefined) updateData.varietal = body.varietal;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    const entry = await prisma.wineEntry.update({
      where: { id: entryId },
      data: updateData,
      include: entryInclude,
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("PATCH wine entry error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update wine entry" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/wine-events/[eventId]/entries/[entryId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId, entryId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existing = await prisma.wineEntry.findUnique({
      where: { id: entryId },
      include: { wineEvent: { select: { tripId: true } } },
    });

    if (!existing || existing.wineEventId !== eventId || existing.wineEvent.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine entry not found" } },
        { status: 404 }
      );
    }

    await prisma.wineEntry.delete({ where: { id: entryId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE wine entry error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete wine entry" } },
      { status: 500 }
    );
  }
}
