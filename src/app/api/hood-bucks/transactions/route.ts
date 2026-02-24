import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

// GET /api/hood-bucks/transactions?memberId=...&tripId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const memberId = request.nextUrl.searchParams.get("memberId");
    const tripId = request.nextUrl.searchParams.get("tripId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "memberId is required" } },
        { status: 400 }
      );
    }

    const where: { memberId: string; tripId?: string } = { memberId };
    if (tripId) where.tripId = tripId;

    const transactions = await prisma.hoodBucksTransaction.findMany({
      where,
      include: {
        trip: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("GET /api/hood-bucks/transactions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch transactions" } },
      { status: 500 }
    );
  }
}

// POST /api/hood-bucks/transactions - Grant bonus
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { memberId, amount, description, tripId } = await request.json();

    if (!memberId || !amount) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "memberId and amount are required" } },
        { status: 400 }
      );
    }

    // Create transaction and update balance in a transaction
    await prisma.$transaction([
      prisma.hoodBucksTransaction.create({
        data: {
          memberId,
          amount,
          type: "BONUS",
          description: description || "Bonus grant",
          tripId: tripId || null,
          userId: user.id,
        },
      }),
      prisma.tripMember.update({
        where: { id: memberId },
        data: { hoodBucksBalance: { increment: amount } },
      }),
    ]);

    return NextResponse.json({ success: true, data: { granted: amount } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/hood-bucks/transactions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to grant bonus" } },
      { status: 500 }
    );
  }
}
