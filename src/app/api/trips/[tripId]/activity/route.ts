import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/activity - Get paginated activity feed
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

    // Check membership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        organizerId: true,
        members: { select: { userId: true } },
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const type = searchParams.get("type") || undefined;

    // Fetch hidden activity types from site settings
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    const hiddenTypes = (siteSettings?.hiddenActivityTypes as string[]) || [];

    // Build type filter: explicit type filter takes priority, otherwise exclude hidden types
    const typeFilter = type
      ? { type: type as never }
      : hiddenTypes.length > 0
        ? { type: { notIn: hiddenTypes as never[] } }
        : {};

    const where = { tripId, ...typeFilter };

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Fetch user info for activity items that have userId
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
    console.error("GET /api/trips/[tripId]/activity error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch activity" } },
      { status: 500 }
    );
  }
}
