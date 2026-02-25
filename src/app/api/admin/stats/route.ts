import { NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTrips,
      activeTrips,
      totalExpenses,
      recentUsers,
      expenseVolume,
      tripsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: { in: ["PLANNING", "CONFIRMED", "ACTIVE"] } } }),
      prisma.expense.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trip.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        activeTrips,
        totalExpenses,
        recentSignups: recentUsers,
        totalExpenseVolume: expenseVolume._sum.amount ?? 0,
        tripsByStatus: tripsByStatus.map((s) => ({
          status: s.status,
          count: s._count._all,
        })),
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
