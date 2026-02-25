import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

const fromEmail = process.env.RESEND_FROM_EMAIL || "GatherGo <noreply@gathergо.app>";

export type EmailType =
  | "trip-invite"
  | "trip-update"
  | "rsvp-confirmation"
  | "meal-assignment"
  | "wine-event-invite"
  | "wine-results"
  | "expense-added"
  | "announcement";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  try {
    const { data, error } = await getResend().emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

// Email template: Trip Invite
export function tripInviteEmail(params: {
  tripTitle: string;
  tripDates: string;
  organizerName: string;
  inviteLink: string;
  coverImageUrl?: string;
}) {
  return {
    subject: `You're invited to ${params.tripTitle}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          ${params.coverImageUrl ? `<img src="${params.coverImageUrl}" alt="${params.tripTitle}" style="width: 100%; height: 200px; object-fit: cover;">` : ""}
          <div style="padding: 32px;">
            <h1 style="color: #F8FAFC; font-size: 28px; margin: 0 0 8px 0;">You're Invited!</h1>
            <p style="color: #94A3B8; font-size: 16px; margin: 0 0 24px 0;">
              ${params.organizerName} has invited you to join an upcoming trip.
            </p>
            <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #0D6B6B; font-size: 24px; margin: 0 0 8px 0;">${params.tripTitle}</h2>
              <p style="color: #F8FAFC; font-size: 16px; margin: 0;">
                <span style="color: #F59E0B;">📅</span> ${params.tripDates}
              </p>
            </div>
            <a href="${params.inviteLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Join This Trip
            </a>
            <p style="color: #64748B; font-size: 14px; margin: 24px 0 0 0;">
              Or copy this link: <a href="${params.inviteLink}" style="color: #0D6B6B;">${params.inviteLink}</a>
            </p>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: RSVP Confirmation
export function rsvpConfirmationEmail(params: {
  guestName: string;
  tripTitle: string;
  tripDates: string;
  tripLink: string;
}) {
  return {
    subject: `You're confirmed for ${params.tripTitle}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🎉</span>
          </div>
          <h1 style="color: #10B981; font-size: 28px; margin: 0 0 8px 0; text-align: center;">You're In!</h1>
          <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 24px 0; text-align: center;">
            Hey ${params.guestName}, you're confirmed for <strong>${params.tripTitle}</strong>!
          </p>
          <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #F8FAFC; font-size: 16px; margin: 0;">
              <span style="color: #F59E0B;">📅</span> ${params.tripDates}
            </p>
          </div>
          <p style="color: #94A3B8; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
            Access your trip dashboard to view the itinerary, meal schedule, and more.
          </p>
          <div style="text-align: center;">
            <a href="${params.tripLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              View Trip Details
            </a>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: Meal Assignment
export function mealAssignmentEmail(params: {
  guestName: string;
  tripTitle: string;
  mealDate: string;
  mealType: string;
  tripLink: string;
}) {
  return {
    subject: `You're cooking ${params.mealType} on ${params.mealDate}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">👨‍🍳</span>
          </div>
          <h1 style="color: #F59E0B; font-size: 28px; margin: 0 0 8px 0; text-align: center;">Chef's Hat On!</h1>
          <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 24px 0; text-align: center;">
            Hey ${params.guestName}, you've been assigned to cook <strong>${params.mealType}</strong> for ${params.tripTitle}!
          </p>
          <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #F8FAFC; font-size: 20px; margin: 0; font-weight: 600;">
              ${params.mealDate}
            </p>
            <p style="color: #F59E0B; font-size: 16px; margin: 8px 0 0 0;">
              ${params.mealType}
            </p>
          </div>
          <p style="color: #94A3B8; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
            Head to the trip page to add your recipes and shopping list!
          </p>
          <div style="text-align: center;">
            <a href="${params.tripLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Plan Your Meal
            </a>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: Wine Event Invite
export function wineEventInviteEmail(params: {
  guestName: string;
  tripTitle: string;
  eventTitle: string;
  eventDate: string;
  priceRange: string;
  eventLink: string;
}) {
  return {
    subject: `🍷 Wine Tasting: ${params.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🍷</span>
          </div>
          <h1 style="color: #7C3AED; font-size: 28px; margin: 0 0 8px 0; text-align: center;">${params.eventTitle}</h1>
          <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 24px 0; text-align: center;">
            A blind wine tasting event for ${params.tripTitle}!
          </p>
          <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #F8FAFC; font-size: 16px; margin: 0 0 12px 0;">
              <span style="color: #F59E0B;">📅</span> ${params.eventDate}
            </p>
            <p style="color: #F8FAFC; font-size: 16px; margin: 0;">
              <span style="color: #10B981;">💰</span> Price Range: ${params.priceRange}
            </p>
          </div>
          <p style="color: #94A3B8; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
            Bring a bottle within the price range. All wines will be tasted blind and voted on. May the best wine win!
          </p>
          <div style="text-align: center;">
            <a href="${params.eventLink}" style="display: inline-block; background-color: #7C3AED; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Submit Your Wine
            </a>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: Wine Results
export function wineResultsEmail(params: {
  guestName: string;
  tripTitle: string;
  eventTitle: string;
  firstPlace: { name: string; winery: string; price: number };
  secondPlace: { name: string; winery: string; price: number };
  thirdPlace: { name: string; winery: string; price: number };
  resultsLink: string;
}) {
  return {
    subject: `🏆 Wine Tasting Results: ${params.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🏆</span>
          </div>
          <h1 style="color: #F59E0B; font-size: 28px; margin: 0 0 8px 0; text-align: center;">The Results Are In!</h1>
          <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 24px 0; text-align: center;">
            ${params.eventTitle} - ${params.tripTitle}
          </p>
          <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #334155;">
              <p style="color: #F59E0B; font-size: 14px; margin: 0 0 4px 0; font-weight: 600;">🥇 1ST PLACE</p>
              <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 4px 0; font-weight: 600;">${params.firstPlace.name}</p>
              <p style="color: #94A3B8; font-size: 14px; margin: 0;">${params.firstPlace.winery} - $${params.firstPlace.price}</p>
            </div>
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #334155;">
              <p style="color: #94A3B8; font-size: 14px; margin: 0 0 4px 0; font-weight: 600;">🥈 2ND PLACE</p>
              <p style="color: #F8FAFC; font-size: 16px; margin: 0 0 4px 0;">${params.secondPlace.name}</p>
              <p style="color: #94A3B8; font-size: 14px; margin: 0;">${params.secondPlace.winery} - $${params.secondPlace.price}</p>
            </div>
            <div>
              <p style="color: #CD7F32; font-size: 14px; margin: 0 0 4px 0; font-weight: 600;">🥉 3RD PLACE</p>
              <p style="color: #F8FAFC; font-size: 16px; margin: 0 0 4px 0;">${params.thirdPlace.name}</p>
              <p style="color: #94A3B8; font-size: 14px; margin: 0;">${params.thirdPlace.winery} - $${params.thirdPlace.price}</p>
            </div>
          </div>
          <div style="text-align: center;">
            <a href="${params.resultsLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              View Full Results
            </a>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: Announcement
export function announcementEmail(params: {
  tripTitle: string;
  title: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  tripLink: string;
}) {
  const priorityColors = {
    LOW: "#64748B",
    NORMAL: "#0D6B6B",
    HIGH: "#F59E0B",
    URGENT: "#EF4444",
  };

  const priorityEmojis = {
    LOW: "📢",
    NORMAL: "📣",
    HIGH: "⚠️",
    URGENT: "🚨",
  };

  return {
    subject: `${priorityEmojis[params.priority]} ${params.title} - ${params.tripTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border-top: 4px solid ${priorityColors[params.priority]};">
          <p style="color: ${priorityColors[params.priority]}; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">
            ${params.priority} ANNOUNCEMENT
          </p>
          <h1 style="color: #F8FAFC; font-size: 24px; margin: 0 0 16px 0;">${params.title}</h1>
          <div style="background-color: #0F172A; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #F8FAFC; font-size: 16px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${params.body}</p>
          </div>
          <p style="color: #64748B; font-size: 14px; margin: 0 0 16px 0;">
            From: ${params.tripTitle}
          </p>
          <a href="${params.tripLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View Trip
          </a>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// Email template: Expense Added
export function expenseAddedEmail(params: {
  guestName: string;
  tripTitle: string;
  expenseTitle: string;
  totalAmount: number;
  yourShare: number;
  paidBy: string;
  tripLink: string;
}) {
  return {
    subject: `New expense: ${params.expenseTitle} - ${params.tripTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #1E293B; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">💸</span>
          </div>
          <h1 style="color: #F8FAFC; font-size: 24px; margin: 0 0 8px 0; text-align: center;">New Expense Added</h1>
          <p style="color: #94A3B8; font-size: 16px; margin: 0 0 24px 0; text-align: center;">
            ${params.tripTitle}
          </p>
          <div style="background-color: #0F172A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">${params.expenseTitle}</p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94A3B8;">Total:</span>
              <span style="color: #F8FAFC; font-weight: 600;">$${params.totalAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94A3B8;">Paid by:</span>
              <span style="color: #F8FAFC;">${params.paidBy}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #334155;">
              <span style="color: #F59E0B; font-weight: 600;">Your share:</span>
              <span style="color: #F59E0B; font-weight: 600;">$${params.yourShare.toFixed(2)}</span>
            </div>
          </div>
          <div style="text-align: center;">
            <a href="${params.tripLink}" style="display: inline-block; background-color: #0D6B6B; color: #F8FAFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              View Expenses
            </a>
          </div>
        </div>
        <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
          Sent by GatherGo - Group Travel Made Easy
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}
