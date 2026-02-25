import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineScoreCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/scores
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
    const validationResult = wineScoreCreateSchema.safeParse({ ...body, wineEventId: eventId });

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

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not a trip member" } },
        { status: 403 }
      );
    }

    const { rankings, tasteNotes } = validationResult.data;

    // Upsert - allow updating existing score
    const score = await prisma.wineScore.upsert({
      where: { wineEventId_memberId: { wineEventId: eventId, memberId: member.id } },
      create: {
        wineEventId: eventId,
        memberId: member.id,
        userId: user.id,
        rankings,
        tasteNotes,
        submittedAt: new Date(),
      },
      update: {
        rankings,
        tasteNotes,
        submittedAt: new Date(),
      },
      include: {
        member: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "WINE_SCORE_SUBMITTED",
      action: `submitted wine scores`,
      entityType: "wineScore",
      entityId: score.id,
    });

    return NextResponse.json({ success: true, data: score }, { status: 201 });
  } catch (error) {
    console.error("POST wine score error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit score" } },
      { status: 500 }
    );
  }
}
