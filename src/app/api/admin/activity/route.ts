import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";

// GET /api/admin/activity - List all activity logs (paginated)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;

    const where = {
      ...(type ? { type: type as never } : {}),
      ...(search ? { action: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          trip: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Fetch user info
    const userIds = [...new Set(items.map((i) => i.userId).filter(Boolean))] as string[];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatarUrl: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = items.map((item) => ({
      ...item,
      user: item.userId ? userMap.get(item.userId) ?? null : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enriched,
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
