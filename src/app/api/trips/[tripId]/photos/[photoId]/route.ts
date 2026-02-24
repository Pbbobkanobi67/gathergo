import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; photoId: string }>;
}

// DELETE /api/trips/[tripId]/photos/[photoId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, photoId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    await prisma.tripPhoto.delete({
      where: { id: photoId, tripId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE photo error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete photo" } },
      { status: 500 }
    );
  }
}
