import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineScoreCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// GET /api/trips/[tripId]/wine-events/[eventId]/scores
// Returns live leaderboard data during SCORING phase
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
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

    const event = await prisma.wineEvent.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          where: { bagNumber: { not: null } },
          select: { id: true, bagNumber: true },
        },
        scores: {
          select: {
            id: true,
            memberId: true,
            tasteNotes: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!event || event.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    // Count total members for progress
    const totalMembers = await prisma.tripMember.count({ where: { tripId } });

    // Build leaderboard: avg score per bottle
    const entryScores: Record<string, { total: number; count: number }> = {};
    for (const entry of event.entries) {
      entryScores[entry.id] = { total: 0, count: 0 };
    }

    for (const score of event.scores) {
      const notes = score.tasteNotes as Record<string, { rating: number }>;
      for (const [entryId, note] of Object.entries(notes)) {
        if (entryScores[entryId] && note.rating > 0) {
          entryScores[entryId].total += note.rating;
          entryScores[entryId].count += 1;
        }
      }
    }

    const leaderboard = event.entries
      .map((entry) => {
        const data = entryScores[entry.id];
        return {
          entryId: entry.id,
          bagNumber: entry.bagNumber,
          avgScore: data.count > 0 ? data.total / data.count : 0,
          voterCount: data.count,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    const currentUserScored = event.scores.some((s) => s.memberId === member.id);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        totalVoters: event.scores.length,
        totalMembers,
        currentUserScored,
      },
    });
  } catch (error) {
    console.error("GET wine scores error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch scores" } },
      { status: 500 }
    );
  }
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
        rankings: rankings || {},
        tasteNotes,
        submittedAt: new Date(),
      },
      update: {
        rankings: rankings || {},
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
