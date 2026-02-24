import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { wineBetCreateSchema } from "@/lib/validations";

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

    // Check sufficient Hood Bucks
    if (betAmountHoodBucks > member.hoodBucksBalance) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Insufficient Hood Bucks" } },
        { status: 400 }
      );
    }

    // Create bet and deduct Hood Bucks atomically
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
      ...(betAmountHoodBucks > 0
        ? [
            prisma.tripMember.update({
              where: { id: member.id },
              data: { hoodBucksBalance: { decrement: betAmountHoodBucks } },
            }),
            prisma.hoodBucksTransaction.create({
              data: {
                memberId: member.id,
                userId: user.id,
                tripId,
                amount: -betAmountHoodBucks,
                type: "BET_PLACED",
                description: `Bet on wine event`,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, data: bet }, { status: 201 });
  } catch (error) {
    console.error("POST wine bet error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to place bet" } },
      { status: 500 }
    );
  }
}
