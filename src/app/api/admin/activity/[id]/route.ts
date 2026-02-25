import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { activityLogUpdateSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/activity/[id] - Update activity log action text
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validation = activityLogUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await prisma.activityLog.update({
      where: { id },
      data: { action: validation.data.action },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleAdminError(error);
  }
}

// DELETE /api/admin/activity/[id] - Delete activity log entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.activityLog.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleAdminError(error);
  }
}
