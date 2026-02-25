import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { TripStatus } from "@/generated/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireAdmin();
    const { tripId } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.status === "string" && Object.values(TripStatus).includes(body.status)) {
      updateData.status = body.status;
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        city: true,
        state: true,
        createdAt: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, expenses: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireAdmin();
    const { tripId } = await params;

    await prisma.trip.delete({ where: { id: tripId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleAdminError(error);
  }
}
