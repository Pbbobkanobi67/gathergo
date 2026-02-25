import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { chatWithAssistant } from "@/lib/gemini";
import { aiChatSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// POST /api/trips/[tripId]/ai/chat - Chat with AI assistant
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Check membership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          select: {
            userId: true,
            guestName: true,
            user: { select: { name: true } },
          },
        },
        _count: {
          select: {
            mealNights: true,
            activities: true,
            expenses: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Trip not found" } },
        { status: 404 }
      );
    }

    const hasAccess = trip.organizerId === user.id || trip.members.some((m) => m.userId === user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = aiChatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.flatten() } },
        { status: 400 }
      );
    }

    // Build trip context
    const expenseTotal = await prisma.expense.aggregate({
      where: { tripId },
      _sum: { amount: true },
    });

    const tripContext = {
      title: trip.title,
      startDate: trip.startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      endDate: trip.endDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      city: trip.city,
      state: trip.state,
      address: trip.address,
      description: trip.description,
      guestCount: trip.members.length,
      guestNames: trip.members.map((m) => m.user?.name || m.guestName || "Guest"),
      mealCount: trip._count.mealNights,
      activityCount: trip._count.activities,
      expenseTotal: expenseTotal._sum.amount || 0,
    };

    const response = await chatWithAssistant(
      validation.data.message,
      tripContext,
      validation.data.history
    );

    return NextResponse.json({
      success: true,
      data: { message: response },
    });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/ai/chat error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get AI response" } },
      { status: 500 }
    );
  }
}
