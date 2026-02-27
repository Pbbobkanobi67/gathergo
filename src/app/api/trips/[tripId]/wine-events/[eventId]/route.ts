import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer, getUserTripMember } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

const fullEntryInclude = {
  submittedBy: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
};

// GET /api/trips/[tripId]/wine-events/[eventId] - Get single wine event with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const wineEvent = await prisma.wineEvent.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: fullEntryInclude,
          orderBy: { createdAt: "asc" },
        },
        scores: {
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        bets: {
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: {
          select: { entries: true, scores: true, bets: true },
        },
      },
    });

    if (!wineEvent) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    if (wineEvent.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    // Get current user's member record
    const currentMember = await getUserTripMember(user.id, tripId);
    const isOrganizer = await isUserTripOrganizer(user.id, tripId);

    // Privacy filtering based on status
    if (wineEvent.status === "OPEN" && !isOrganizer) {
      // Only show current user's entries during OPEN phase
      wineEvent.entries = wineEvent.entries.filter(
        (e) => e.submittedByMemberId === currentMember?.id
      );
    } else if (wineEvent.status === "SCORING" && !isOrganizer) {
      // Strip wine details during SCORING - only show bag numbers
      wineEvent.entries = wineEvent.entries
        .filter((e) => e.bagNumber !== null)
        .map((e) => ({
          ...e,
          wineName: `Bag #${e.bagNumber}`,
          winery: null,
          varietal: null,
          vintage: null,
          price: 0,
          notes: null,
          imageUrl: null,
          submittedBy: null,
          submittedByMemberId: null,
        }));
    }
    // REVEAL, COMPLETE, SETUP: return everything unmasked

    return NextResponse.json({ success: true, data: wineEvent });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/wine-events/[eventId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch wine event" } },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[tripId]/wine-events/[eventId] - Update a wine event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const existing = await prisma.wineEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing || existing.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();

    const wineEvent = await prisma.wineEvent.update({
      where: { id: eventId },
      data: body,
      include: {
        entries: {
          include: fullEntryInclude,
          orderBy: { createdAt: "asc" },
        },
        scores: {
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        bets: {
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: {
          select: { entries: true, scores: true, bets: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: wineEvent });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/wine-events/[eventId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update wine event" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/wine-events/[eventId] - Delete a wine event (organizer only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
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
        { success: false, error: { code: "FORBIDDEN", message: "Only the organizer can delete wine events" } },
        { status: 403 }
      );
    }

    const existing = await prisma.wineEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing || existing.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    await prisma.wineEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true, data: { id: eventId } });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/wine-events/[eventId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete wine event" } },
      { status: 500 }
    );
  }
}
