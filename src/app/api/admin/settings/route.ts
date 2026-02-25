import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAdminError } from "@/lib/admin";
import prisma from "@/lib/prisma";

const SETTINGS_ID = "default";

// GET /api/admin/settings - Get site settings
export async function GET() {
  try {
    await requireAdmin();

    let settings = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: SETTINGS_ID, hiddenActivityTypes: [] },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleAdminError(error);
  }
}

// PATCH /api/admin/settings - Update site settings
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { hiddenActivityTypes } = body;

    if (hiddenActivityTypes !== undefined && !Array.isArray(hiddenActivityTypes)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "hiddenActivityTypes must be an array" } },
        { status: 400 }
      );
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        hiddenActivityTypes: hiddenActivityTypes ?? [],
      },
      update: {
        hiddenActivityTypes: hiddenActivityTypes ?? [],
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleAdminError(error);
  }
}
