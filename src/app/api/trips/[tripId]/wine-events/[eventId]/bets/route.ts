import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineBetCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/bets
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
    const validationResult = wineBetCreateSchema.safeParse({ ...body, wineEventId: eventId });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      select: { id: true, hoodBucksBalance: true },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not a trip member" } },
        { status: 403 }
      );
    }

    const { predictedFirst, predictedSecond, predictedThird, betAmountHoodBucks, betAmountCash } =
      validationResult.data;

    // Check for existing bet to calculate the delta
    const existingBet = await prisma.wineBet.findUnique({
      where: { wineEventId_memberId: { wineEventId: eventId, memberId: member.id } },
      select: { betAmountHoodBucks: true },
    });

    const previousAmount = existingBet?.betAmountHoodBucks ?? 0;
    const delta = betAmountHoodBucks - previousAmount;

    // Only check balance if we need to deduct more
    if (delta > 0 && delta > member.hoodBucksBalance) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Insufficient Hood Bucks" } },
        { status: 400 }
      );
    }

    // Create/update bet and adjust Hood Bucks atomically
    const [bet] = await prisma.$transaction([
      prisma.wineBet.upsert({
        where: { wineEventId_memberId: { wineEventId: eventId, memberId: member.id } },
        create: {
          wineEventId: eventId,
          memberId: member.id,
          userId: user.id,
          predictedFirst,
          predictedSecond,
          predictedThird,
          betAmountHoodBucks,
          betAmountCash,
        },
        update: {
          predictedFirst,
          predictedSecond,
          predictedThird,
          betAmountHoodBucks,
          betAmountCash,
        },
        include: {
          member: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      }),
      ...(delta !== 0
        ? [
            prisma.tripMember.update({
              where: { id: member.id },
              data: { hoodBucksBalance: { decrement: delta } },
            }),
            prisma.hoodBucksTransaction.create({
              data: {
                memberId: member.id,
                userId: user.id,
                tripId,
                amount: -delta,
                type: "BET_PLACED",
                description: delta > 0 ? `Bet on wine event` : `Bet adjustment refund`,
              },
            }),
          ]
        : []),
    ]);

    logActivity({
      tripId,
      userId: user.id,
      type: "WINE_BET_PLACED",
      action: existingBet ? `updated a wine bet` : `placed a wine bet`,
      entityType: "wineBet",
      entityId: bet.id,
    });

    return NextResponse.json({ success: true, data: bet }, { status: 201 });
  } catch (error) {
    console.error("POST wine bet error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to place bet" } },
      { status: 500 }
    );
  }
}
