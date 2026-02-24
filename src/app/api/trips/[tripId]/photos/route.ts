import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { photoCreateSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

const photoInclude = {
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

// GET /api/trips/[tripId]/photos
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

    const photos = await prisma.tripPhoto.findMany({
      where: { tripId },
      include: photoInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error("GET photos error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch photos" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/photos
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
    const validationResult = photoCreateSchema.safeParse({ ...body, tripId });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validationResult.error.flatten() } },
        { status: 400 }
      );
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      select: { id: true },
    });

    const { imageUrl, caption, takenAt } = validationResult.data;

    const photo = await prisma.tripPhoto.create({
      data: {
        tripId,
        imageUrl,
        caption,
        takenAt,
        uploadedByMemberId: member?.id,
      },
      include: photoInclude,
    });

    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (error) {
    console.error("POST photo error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to upload photo" } },
      { status: 500 }
    );
  }
}
