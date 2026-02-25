import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { documentCreateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ tripId: string }>;
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

// GET /api/trips/[tripId]/documents
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

    const documents = await prisma.tripDocument.findMany({
      where: { tripId },
      include: documentInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("GET /api/trips/[tripId]/documents error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch documents" } },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/documents
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
    const validationResult = documentCreateSchema.safeParse({ ...body, tripId });

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

    const { title, category, fileUrl, fileType } = validationResult.data;

    // Find member record for the current user
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
      select: { id: true },
    });

    const document = await prisma.tripDocument.create({
      data: {
        tripId,
        title,
        category,
        fileUrl,
        fileType,
        uploadedByMemberId: member?.id,
      },
      include: documentInclude,
    });

    logActivity({
      tripId,
      userId: user.id,
      type: "DOCUMENT_UPLOADED",
      action: `uploaded a document: ${document.title}`,
      entityType: "document",
      entityId: document.id,
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/documents error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create document" } },
      { status: 500 }
    );
  }
}
