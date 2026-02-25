import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineEntryCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/entries
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = wineEntryCreateSchema.safeParse({ ...body, wineEventId: eventId });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      select: { id: true },
    });

    // Auto-assign next bag number
    const lastEntry = await prisma.wineEntry.findFirst({
      where: { wineEventId: eventId },
      orderBy: { bagNumber: "desc" },
      select: { bagNumber: true },
    });

    const { wineName, winery, vintage, varietal, price, imageUrl, notes } = validationResult.data;

    const entry = await prisma.wineEntry.create({
      data: {
        wineEventId: eventId,
        bagNumber: (lastEntry?.bagNumber || 0) + 1,
        wineName,
        winery,
        vintage,
        varietal,
        price,
        imageUrl,
        notes,
        submittedByMemberId: member?.id,
      },
      include: {
        submittedBy: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "WINE_ENTRY_SUBMITTED",
      action: `submitted a wine entry: ${entry.wineName}`,
      entityType: "wineEntry",
      entityId: entry.id,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error("POST wine entry error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create wine entry" } },
      { status: 500 }
    );
  }
}
