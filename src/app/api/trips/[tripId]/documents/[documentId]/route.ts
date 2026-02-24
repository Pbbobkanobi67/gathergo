import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; documentId: string }>;
}

const documentInclude = {
  uploadedBy: {
    select: {
      id: true,
      guestName: true,
      role: true,
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  },
};

// PATCH /api/trips/[tripId]/documents/[documentId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, documentId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const document = await prisma.tripDocument.update({
      where: { id: documentId, tripId },
      data: body,
      include: documentInclude,
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("PATCH /api/trips/[tripId]/documents/[documentId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update document" } },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/documents/[documentId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, documentId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    await prisma.tripDocument.delete({
      where: { id: documentId, tripId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/documents/[documentId] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete document" } },
      { status: 500 }
    );
  }
}
