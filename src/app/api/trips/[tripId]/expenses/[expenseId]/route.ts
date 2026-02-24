import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; expenseId: string }>;
}

// Shared include object for consistent response shape
const expenseInclude = {
  paidByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      venmoHandle: true,
    },
  },
  splits: {
    include: {
      member: {
        select: {
          id: true,
          guestName: true,
          role: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              venmoHandle: true,
            },
          },
        },
      },
    },
  },
} as const;

// GET /api/trips/[tripId]/expenses/[expenseId] - Get a single expense
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, expenseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, tripId },
      include: expenseInclude,
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Expense not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch expense" } },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[tripId]/expenses/[expenseId] - Update an expense
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, expenseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Verify expense exists and belongs to this trip
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId, tripId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Expense not found" } },
        { status: 404 }
      );
    }

    // Only the payer or trip organizer can update
    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    const isPayer = existing.paidByUserId === user.id;

    if (!isOrganizer && !isPayer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the payer or organizer can update this expense" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { splits, ...updateFields } = body;

    // Filter to only allowed update fields
    const allowedFields = [
      "title",
      "category",
      "amount",
      "currency",
      "date",
      "splitType",
      "receiptImageUrl",
      "notes",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        data[field] = updateFields[field];
      }
    }

    // If date is a string, convert to Date
    if (typeof data.date === "string") {
      data.date = new Date(data.date as string);
    }

    // If splits are being updated, replace them in a transaction
    if (splits && Array.isArray(splits)) {
      const expense = await prisma.$transaction(async (tx) => {
        // Delete existing splits
        await tx.expenseSplit.deleteMany({
          where: { expenseId },
        });

        // Update expense and create new splits
        return tx.expense.update({
          where: { id: expenseId },
          data: {
            ...data,
            splits: {
              create: splits.map((split: { memberId: string; amount: number }) => ({
                memberId: split.memberId,
                amount: split.amount,
              })),
            },
          },
          include: expenseInclude,
        });
      });

      return NextResponse.json({ success: true, data: expense });
    }

    // Simple update without split changes
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data,
      include: expenseInclude,
    });

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update expense" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/expenses/[expenseId] - Delete an expense (organizer only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, expenseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only organizers can delete expenses" } },
        { status: 403 }
      );
    }

    // Verify expense exists and belongs to this trip
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId, tripId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Expense not found" } },
        { status: 404 }
      );
    }

    // Delete expense (splits cascade via onDelete: Cascade in schema)
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true, data: { id: expenseId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete expense" } },
      { status: 500 }
    );
  }
}
