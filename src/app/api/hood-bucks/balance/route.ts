import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

// GET /api/hood-bucks/balance?memberId=...
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
    if (!memberId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "memberId is required" } },
        { status: 400 }
      );
    }

    const member = await prisma.tripMember.findUnique({
      where: { id: memberId },
      select: { hoodBucksBalance: true },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 }
      );
    }

    const transactions = await prisma.hoodBucksTransaction.findMany({
      where: { memberId },
      select: { amount: true },
    });

    const totalEarned = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = Math.abs(transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

    return NextResponse.json({
      success: true,
      data: { balance: member.hoodBucksBalance, totalEarned, totalSpent },
    });
  } catch (error) {
    console.error("GET /api/hood-bucks/balance error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch balance" } },
      { status: 500 }
    );
  }
}
