import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

// GET /api/hood-bucks/leaderboard?tripId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const tripId = request.nextUrl.searchParams.get("tripId");
    if (!tripId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "tripId is required" } },
        { status: 400 }
      );
    }

    const members = await prisma.tripMember.findMany({
      where: { tripId },
      select: {
        id: true,
        guestName: true,
        hoodBucksBalance: true,
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { hoodBucksBalance: "desc" },
    });

    const leaderboard = members.map((m, index) => ({
      rank: index + 1,
      memberId: m.id,
      name: m.user?.name || m.guestName || "Guest",
      avatarUrl: m.user?.avatarUrl || null,
      balance: m.hoodBucksBalance,
    }));

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("GET /api/hood-bucks/leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch leaderboard" } },
      { status: 500 }
    );
  }
}
