import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type SmsType =
  | "trip-invite"
  | "trip-reminder"
  | "wine-scoring-open"
  | "wine-results"
  | "urgent-announcement";

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams) {
  if (!client || !fromNumber) {
    console.warn("Twilio not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(to);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number" };
    }

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizedPhone,
    });

    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("Twilio error:", err);
    return { success: false, error: "Failed to send SMS" };
  }
}

// Send SMS to multiple recipients
export async function sendBulkSms(recipients: string[], body: string) {
  const results = await Promise.all(
    recipients.map((to) => sendSms({ to, body }))
  );

  return {
    success: results.every((r) => r.success),
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle numbers with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Already has full international format
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return null;
}

// SMS Templates

export function tripInviteSms(params: {
  organizerName: string;
  tripTitle: string;
  inviteLink: string;
}): string {
  return `${params.organizerName} invited you to "${params.tripTitle}"! Join here: ${params.inviteLink}`;
}

export function tripReminderSms(params: {
  tripTitle: string;
  startsIn: string;
  tripLink: string;
}): string {
  return `Reminder: "${params.tripTitle}" starts ${params.startsIn}! ${params.tripLink}`;
}

export function wineScoringOpenSms(params: {
  eventTitle: string;
  tripTitle: string;
  scoreLink: string;
}): string {
  return `🍷 Wine scoring is now open for "${params.eventTitle}" (${params.tripTitle})! Score your wines: ${params.scoreLink}`;
}

export function wineResultsSms(params: {
  eventTitle: string;
  winnerName: string;
  resultsLink: string;
}): string {
  return `🏆 Results are in! "${params.winnerName}" won "${params.eventTitle}"! See full results: ${params.resultsLink}`;
}

export function urgentAnnouncementSms(params: {
  tripTitle: string;
  title: string;
  preview: string;
  tripLink: string;
}): string {
  const truncatedPreview = params.preview.length > 100
    ? params.preview.substring(0, 97) + "..."
    : params.preview;
  return `🚨 ${params.tripTitle}: ${params.title} - ${truncatedPreview} ${params.tripLink}`;
}

// Check if a phone number is valid
export function isValidPhoneNumber(phone: string): boolean {
  return normalizePhoneNumber(phone) !== null;
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}
