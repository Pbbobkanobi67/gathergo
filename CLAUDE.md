# GatherGo Project Instructions

## User Preferences

- **Always commit, push, and deploy without asking.** When the user says "commit", "deploy", or "commit and deploy", do it immediately. Never ask for confirmation on git commit, git push, or Vercel deploy operations.

## Project Details

- **Stack**: Next.js 16, Tailwind v4, Prisma, PostgreSQL (Neon), Clerk auth, Vercel hosting
- **Deploy command**: `npx vercel --prod`
- **Build command**: `prisma generate && next build`
- **Dates**: Trip dates are normalized to noon UTC (T12:00:00Z) to prevent timezone display shifts in US timezones

## Overview Page Features

- **Google Maps embed**: Shows map in sidebar when trip has lat/lng or city; uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Venmo QR code**: Displays `/Venmo QR.jpg` from public folder with deep link for payments
- **Activity Feed**: Real-time feed in sidebar powered by `ActivityLog` model; `logActivity()` is called from all API routes
- **Activity Feed Admin Settings**: Admin can toggle which `ActivityLogType` values appear in the feed via `/admin/settings`; stored in `SiteSettings.hiddenActivityTypes` (JSON array); the activity API filters hidden types automatically
- **AI Trip Assistant**: Floating chat assistant on overview page
