import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import type { User } from "@/generated/prisma";

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AdminError("UNAUTHORIZED", "Not authenticated", 401);
  }

  if (!user.isAdmin) {
    throw new AdminError("FORBIDDEN", "Admin access required", 403);
  }

  return user;
}

export class AdminError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export function handleAdminError(error: unknown) {
  if (error instanceof AdminError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  console.error("Admin route error:", error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}
