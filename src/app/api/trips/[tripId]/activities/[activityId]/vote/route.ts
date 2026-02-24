import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; activityId: string }>;
}

// POST /api/trips/[tripId]/activities/[activityId]/vote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, activityId } = await params;
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

    const body = await request.json();
    const voteType = body.vote || "UP";

    // Upsert vote - toggle if same vote exists
    const existing = await prisma.activityVote.findUnique({
      where: { activityId_memberId: { activityId, memberId: member.id } },
    });

    if (existing) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.activityVote.delete({
          where: { id: existing.id },
        }),
        prisma.activity.update({
          where: { id: activityId },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true, data: { voted: false, voteType: null } });
    }

    // Create new vote
    await prisma.$transaction([
      prisma.activityVote.create({
        data: {
          activityId,
          memberId: member.id,
          vote: voteType,
        },
      }),
      prisma.activity.update({
        where: { id: activityId },
        data: { voteCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, data: { voted: true, voteType } }, { status: 201 });
  } catch (error) {
    console.error("POST vote error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to vote" } },
      { status: 500 }
    );
  }
}
