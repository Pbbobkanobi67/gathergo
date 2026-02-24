import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { guestJoinSchema } from "@/lib/validations";
import { generateInviteToken } from "@/lib/utils";
import { grantInitialBalance } from "@/lib/hood-bucks";
import { sendEmail, rsvpConfirmationEmail } from "@/lib/resend";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/guest/join/[token] - Get trip info for invite page
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const trip = await prisma.trip.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        startDate: true,
        endDate: true,
        city: true,
        state: true,
        coverImageUrl: true,
        status: true,
        inviteTokenExpiry: true,
        organizer: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invalid invite link" } },
        { status: 404 }
      );
    }

    // Check if invite is expired
    if (trip.inviteTokenExpiry && new Date() > trip.inviteTokenExpiry) {
      return NextResponse.json(
        { success: false, error: { code: "EXPIRED", message: "This invite link has expired" } },
        { status: 410 }
      );
    }

    // Check if trip is cancelled
    if (trip.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: { code: "CANCELLED", message: "This trip has been cancelled" } },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("GET /api/guest/join/[token] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch trip info" } },
      { status: 500 }
    );
  }
}

// POST /api/guest/join/[token] - Join trip as guest
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();

    const validationResult = guestJoinSchema.safeParse(body);

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

    const data = validationResult.data;

    // Find the trip
    const trip = await prisma.trip.findUnique({
      where: { inviteToken: token },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invalid invite link" } },
        { status: 404 }
      );
    }

    // Check if invite is expired
    if (trip.inviteTokenExpiry && new Date() > trip.inviteTokenExpiry) {
      return NextResponse.json(
        { success: false, error: { code: "EXPIRED", message: "This invite link has expired" } },
        { status: 410 }
      );
    }

    // Check if guest already exists
    const existingMember = await prisma.tripMember.findFirst({
      where: {
        tripId: trip.id,
        guestEmail: data.email,
      },
    });

    if (existingMember) {
      // Return existing member info
      return NextResponse.json({
        success: true,
        data: {
          member: existingMember,
          tripId: trip.id,
          isExisting: true,
        },
      });
    }

    // Create new guest member
    const guestToken = generateInviteToken();

    const member = await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone,
        role: "GUEST",
        rsvpStatus: "CONFIRMED",
        isCouple: data.isCouple,
        couplePartnerName: data.couplePartnerName,
        dietaryRestrictions: data.dietaryRestrictions,
        allergies: data.allergies,
        notes: data.notes,
        inviteToken: guestToken,
        joinedAt: new Date(),
      },
    });

    // Grant initial Hood Bucks
    await grantInitialBalance(member.id, trip.id);

    // Send confirmation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tripLink = `${appUrl}/trip/${trip.id}?token=${guestToken}`;

    const emailContent = rsvpConfirmationEmail({
      guestName: data.name,
      tripTitle: trip.title,
      tripDates: `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`,
      tripLink,
    });

    await sendEmail({
      to: data.email,
      ...emailContent,
    });

    // Set guest token in response for client to store
    const response = NextResponse.json({
      success: true,
      data: {
        member,
        tripId: trip.id,
        guestToken,
        isExisting: false,
      },
    });

    // Set cookie for guest authentication
    response.cookies.set("guestToken", guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/guest/join/[token] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to join trip" } },
      { status: 500 }
    );
  }
}
