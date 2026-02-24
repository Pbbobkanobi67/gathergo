"use client";

import { useUser as useClerkUser, UserButton as ClerkUserButton } from "@clerk/nextjs";
import type { ComponentProps } from "react";

// Safe wrapper around useUser that handles when Clerk isn't configured
export function useSafeUser() {
  try {
    const result = useClerkUser();
    return result;
  } catch {
    // Return a mock result when ClerkProvider isn't available
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    };
  }
}

// Safe wrapper around UserButton that only renders when Clerk is configured
export function SafeUserButton(props: ComponentProps<typeof ClerkUserButton>) {
  const { user, isLoaded } = useSafeUser();

  // If no user or still loading, don't render
  // This also handles the case when Clerk isn't configured
  if (!isLoaded || !user) {
    return null;
  }

  // At this point, Clerk is configured and user exists
  return <ClerkUserButton {...props} />;
}
