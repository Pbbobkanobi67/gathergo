import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "./prisma";
import type { User } from "@/generated/prisma";

// Get the current authenticated user from Clerk and sync to database
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Try to find existing user in database
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // If user doesn't exist, create from Clerk data
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "User",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  return user;
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

// Sync user data from Clerk webhook
export async function syncUserFromWebhook(data: {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  phone_numbers: Array<{ phone_number: string }>;
  image_url: string;
}): Promise<User> {
  const email = data.email_addresses[0]?.email_address ?? "";
  const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "User";
  const phone = data.phone_numbers[0]?.phone_number;

  return prisma.user.upsert({
    where: { clerkId: data.id },
    update: {
      email,
      name,
      phone,
      avatarUrl: data.image_url,
    },
    create: {
      clerkId: data.id,
      email,
      name,
      phone,
      avatarUrl: data.image_url,
    },
  });
}

// Check if user is organizer of a trip
export async function isUserTripOrganizer(userId: string, tripId: string): Promise<boolean> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { organizerId: true },
  });

  return trip?.organizerId === userId;
}

// Check if user is member of a trip
export async function isUserTripMember(userId: string, tripId: string): Promise<boolean> {
  const member = await prisma.tripMember.findFirst({
    where: {
      tripId,
      userId,
    },
  });

  return !!member;
}

// Get user's trip member record for a specific trip
export async function getUserTripMember(userId: string, tripId: string) {
  return prisma.tripMember.findFirst({
    where: {
      tripId,
      userId,
    },
  });
}
