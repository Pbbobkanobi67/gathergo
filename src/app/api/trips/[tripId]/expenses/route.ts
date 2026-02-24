import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/expenses - List all expenses for a trip
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: {
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
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/expenses error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch expenses" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/expenses - Create a new expense
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

    const body = await request.json();
    const validationResult = expenseCreateSchema.safeParse({ ...body, tripId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { title, category, amount, currency, date, splitType, receiptImageUrl, notes, splits } =
      validationResult.data;

    // Build the expense creation data
    const expenseData: Parameters<typeof prisma.expense.create>[0]["data"] = {
      tripId,
      title,
      category,
      amount,
      currency,
      date: date ?? new Date(),
      splitType,
      receiptImageUrl,
      notes,
      paidByUserId: user.id,
    };

    // Determine splits based on splitType
    if (splitType === "EQUAL") {
      // Fetch all trip members and create equal splits
      const members = await prisma.tripMember.findMany({
        where: { tripId },
        select: { id: true },
      });

      if (members.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Trip has no members to split with" } },
          { status: 400 }
        );
      }

      const splitAmount = parseFloat((amount / members.length).toFixed(2));

      const expense = await prisma.expense.create({
        data: {
          ...expenseData,
          splits: {
            create: members.map((member) => ({
              memberId: member.id,
              amount: splitAmount,
            })),
          },
        },
        include: {
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
        },
      });

      return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } else if (splitType === "CUSTOM") {
      // Use the splits array provided in the request body
      if (!splits || splits.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Custom splits require a splits array" } },
          { status: 400 }
        );
      }

      const expense = await prisma.expense.create({
        data: {
          ...expenseData,
          splits: {
            create: splits.map((split) => ({
              memberId: split.memberId,
              amount: split.amount,
            })),
          },
        },
        include: {
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
        },
      });

      return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } else {
      // ORGANIZER_ONLY - no splits created
      const expense = await prisma.expense.create({
        data: expenseData,
        include: {
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
        },
      });

      return NextResponse.json({ success: true, data: expense }, { status: 201 });
    }
  } catch (error) {
    console.error("POST /api/trips/[tripId]/expenses error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create expense" } },
      { status: 500 }
    );
  }
}
