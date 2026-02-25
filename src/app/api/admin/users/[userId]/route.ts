import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;
    const body = await request.json();

    // Prevent admin from removing their own admin status
    if (userId === admin.id && body.isAdmin === false) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot remove your own admin status" } },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.email === "string") updateData.email = body.email;
    if (typeof body.isAdmin === "boolean") updateData.isAdmin = body.isAdmin;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    if (userId === admin.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot delete your own account" } },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleAdminError(error);
  }
}
