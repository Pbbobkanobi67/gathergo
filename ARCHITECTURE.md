# GatherGo Architecture Documentation

## Overview

GatherGo is a comprehensive group travel planning application built with Next.js 14, designed for organizing cabin trips, road trips, cruises, and other group adventures. The app supports both authenticated organizers (via Clerk) and guest users (via invite tokens).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, Framer Motion |
| Backend | Next.js API Routes (Edge/Node) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth (Organizers) | Clerk |
| Auth (Guests) | Custom invite token system |
| Real-time | Supabase Realtime |
| File Storage | Supabase Storage |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe |
| Deployment | Vercel |

---

## Database Schema Overview

### Core Entities

```
User (Clerk-authenticated organizers)
  ├── Trip (many)
  ├── TripMember (many - as organizer)
  ├── Expense (many - as payer)
  └── HoodBucksTransaction (many)

Trip
  ├── TripMember (many - all guests)
  ├── ItineraryDay (many)
  │   └── Activity (many)
  ├── MealNight (many)
  │   ├── Recipe (many)
  │   └── ShoppingItem (many)
  ├── WineEvent (many)
  │   ├── WineEntry (many)
  │   ├── WineScore (many)
  │   └── WineBet (many)
  ├── Expense (many)
  ├── Announcement (many)
  ├── TripDocument (many)
  ├── ChatMessage (many)
  ├── TripPhoto (many)
  └── PackingItem (many)
```

### Entity Relationships

- **User → Trip**: One-to-Many (user organizes trips)
- **Trip → TripMember**: One-to-Many (trip has many guests)
- **TripMember → User**: Many-to-One (optional - guests may not have accounts)
- **Trip → WineEvent**: One-to-Many (trip can have multiple wine tastings)
- **WineEvent → WineEntry**: One-to-Many (each event has bottles)
- **WineEvent → WineScore**: One-to-Many (each guest submits scores)
- **WineEvent → WineBet**: One-to-Many (guests place bets)
- **TripMember → HoodBucksTransaction**: One-to-Many (currency ledger)

---

## Authentication Flow

### Organizers (Clerk Auth)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Sign Up/In    │────▶│   Clerk Auth    │────▶│  Dashboard      │
│   (Clerk UI)    │     │   (JWT Token)   │     │  /dashboard     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. Organizer signs up/in via Clerk
2. Clerk issues JWT token stored in cookies
3. All `/dashboard/*` routes protected by Clerk middleware
4. User record synced to database via Clerk webhook or first API call

### Guests (Invite Token System)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Invite Link    │────▶│  Join Page      │────▶│  Guest Cookie   │
│  /join/[token]  │     │  Name/Email     │     │  guestToken     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Guest Trip     │
                                               │  /trip/[id]/*   │
                                               └─────────────────┘
```

1. Organizer generates unique invite link: `gathergо.app/join/[inviteToken]`
2. Guest visits link, enters name/email/phone
3. System creates `TripMember` record with unique `guestToken`
4. `guestToken` stored in HTTP-only cookie + localStorage
5. Guest accesses trip via `/trip/[tripId]/*` routes
6. API routes validate guest token for authorization

---

## API Route Structure

### Authentication Middleware

```typescript
// Organizer routes: Clerk middleware
// Guest routes: Custom guestToken validation
// Public routes: No auth required
```

### Route Hierarchy

```
/api
├── /auth
│   └── /webhook/route.ts          # Clerk webhook for user sync
│
├── /trips
│   ├── route.ts                   # GET (list), POST (create)
│   └── /[tripId]
│       ├── route.ts               # GET, PATCH, DELETE
│       ├── /invite/route.ts       # POST (generate invite link)
│       ├── /members/route.ts      # GET (list), POST (add)
│       └── /announce/route.ts     # POST (send announcement)
│
├── /itinerary
│   └── /[tripId]
│       ├── /days/route.ts         # GET, POST
│       └── /activities/route.ts   # GET, POST, PATCH, DELETE
│
├── /meals
│   ├── route.ts                   # GET (by tripId), POST
│   └── /[mealId]
│       ├── route.ts               # GET, PATCH, DELETE
│       ├── /recipes/route.ts      # GET, POST
│       └── /shopping/route.ts     # GET, POST, PATCH
│
├── /wine
│   └── /events
│       ├── route.ts               # GET (by tripId), POST
│       └── /[eventId]
│           ├── route.ts           # GET, PATCH, DELETE
│           ├── /entries/route.ts  # GET, POST
│           ├── /scores/route.ts   # GET, POST
│           ├── /bets/route.ts     # GET, POST
│           └── /reveal/route.ts   # POST (trigger reveal)
│
├── /expenses
│   ├── route.ts                   # GET (by tripId), POST
│   └── /[expenseId]/route.ts      # GET, PATCH, DELETE
│
├── /packing
│   └── /[tripId]/route.ts         # GET, POST, PATCH
│
├── /documents
│   └── /[tripId]/route.ts         # GET, POST, DELETE
│
├── /photos
│   └── /[tripId]/route.ts         # GET, POST, DELETE
│
├── /chat
│   └── /[tripId]/route.ts         # GET, POST
│
├── /notifications
│   ├── /send/route.ts             # POST (send email/SMS)
│   └── /preferences/route.ts      # GET, PATCH
│
├── /payments
│   ├── /checkout/route.ts         # POST (create Stripe session)
│   └── /webhook/route.ts          # POST (Stripe webhook)
│
├── /hood-bucks
│   ├── /balance/route.ts          # GET (member balance)
│   └── /transactions/route.ts     # GET (ledger), POST (admin grant)
│
├── /upload/route.ts               # POST (file upload to Supabase)
│
└── /guest
    ├── /join/[token]/route.ts     # POST (join trip as guest)
    └── /rsvp/route.ts             # PATCH (update RSVP status)
```

### API Response Format

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

---

## Component Tree & Page Hierarchy

### Layout Structure

```
RootLayout (app/layout.tsx)
├── ClerkProvider
├── QueryClientProvider
├── ThemeProvider
└── ToastProvider

AuthLayout (app/(auth)/layout.tsx)
├── Centered container
└── No navigation

DashboardLayout (app/(dashboard)/layout.tsx)
├── Sidebar (desktop)
├── TopNav
│   ├── Search
│   ├── HoodBucksBalance
│   ├── NotificationBell
│   └── UserMenu
├── MobileNav (bottom tabs)
└── MainContent

GuestLayout (app/(guest)/layout.tsx)
├── GuestTopNav
│   ├── TripTitle
│   └── GuestMenu
└── MobileNav (simplified)
```

### Page Hierarchy

```
(auth)
├── /sign-in/[[...sign-in]]
└── /sign-up/[[...sign-up]]

(dashboard)
├── /dashboard                     # Home/overview
├── /trips
│   ├── /                          # Trip list
│   ├── /new                       # Create trip
│   └── /[tripId]
│       ├── /                      # Trip hub/overview
│       ├── /itinerary             # Day-by-day planner
│       ├── /meals                 # Meal calendar
│       ├── /wine
│       │   ├── /                  # Wine events list
│       │   └── /[eventId]         # Event detail/scoring
│       ├── /expenses              # Expense tracker
│       ├── /guests                # Guest management
│       ├── /packing               # Packing list
│       ├── /documents             # Document vault
│       ├── /photos                # Photo gallery
│       └── /settings              # Trip settings
├── /profile                       # User profile
└── /hood-bucks                    # Hood Bucks ledger

(guest)
├── /join/[inviteToken]            # Join trip landing
└── /trip/[tripId]
    ├── /                          # Guest trip view
    ├── /meals                     # Meal schedule
    ├── /wine/[eventId]            # Wine scoring
    └── /packing                   # Packing list
```

---

## Real-time Subscription Strategy

### Supabase Realtime Channels

```typescript
// Per-trip channel for all members
const tripChannel = supabase
  .channel(`trip:${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trip_members',
    filter: `trip_id=eq.${tripId}`
  }, handleMemberChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages',
    filter: `trip_id=eq.${tripId}`
  }, handleNewMessage)
  .subscribe()

// Wine event channel for live scoring updates
const wineChannel = supabase
  .channel(`wine:${eventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'wine_scores',
    filter: `wine_event_id=eq.${eventId}`
  }, handleScoreUpdate)
  .subscribe()
```

### Tables with Real-time Enabled

| Table | Events | Use Case |
|-------|--------|----------|
| trip_members | INSERT, UPDATE | RSVP updates, new joins |
| chat_messages | INSERT | Live chat |
| wine_scores | INSERT, UPDATE | Scoring progress |
| wine_events | UPDATE | Status changes (SCORING → REVEAL) |
| expenses | INSERT, UPDATE | New expenses, settlements |
| hood_bucks_transactions | INSERT | Balance updates |

---

## File Storage Strategy

### Supabase Storage Buckets

```
gathergo-storage/
├── trip-covers/
│   └── {tripId}/cover.{ext}
├── receipts/
│   └── {tripId}/{expenseId}.{ext}
├── wine-photos/
│   └── {eventId}/{entryId}.{ext}
├── recipe-photos/
│   └── {mealId}/{recipeId}.{ext}
├── documents/
│   └── {tripId}/{documentId}.{ext}
├── trip-photos/
│   └── {tripId}/{photoId}.{ext}
└── avatars/
    └── {memberId}.{ext}
```

### Upload Flow

```typescript
// 1. Client requests signed upload URL
const { signedUrl, path } = await api.upload.getSignedUrl({
  bucket: 'trip-covers',
  tripId: '123',
  fileType: 'image/jpeg'
})

// 2. Client uploads directly to Supabase
await fetch(signedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
})

// 3. Client notifies server of completion
await api.trips.updateCover({ tripId: '123', path })
```

---

## Email Notification Queue Strategy

### Resend Integration

```typescript
// Email types
enum EmailType {
  TRIP_INVITE = 'trip-invite',
  TRIP_UPDATE = 'trip-update',
  RSVP_CONFIRMATION = 'rsvp-confirmation',
  MEAL_ASSIGNMENT = 'meal-assignment',
  WINE_EVENT_INVITE = 'wine-event-invite',
  WINE_RESULTS = 'wine-results',
  EXPENSE_ADDED = 'expense-added',
  ANNOUNCEMENT = 'announcement'
}

// Email templates stored in /src/lib/email-templates/
// Each template is a React component rendered to HTML

// Sending flow
async function sendEmail(params: {
  to: string[]
  type: EmailType
  data: Record<string, any>
  tripId?: string
}) {
  const template = getTemplate(params.type)
  const html = render(template, params.data)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: params.to,
    subject: getSubject(params.type, params.data),
    html
  })
}
```

### Notification Preferences

```typescript
interface NotificationPrefs {
  tripUpdates: boolean
  mealChanges: boolean
  activityVotes: boolean
  wineContest: boolean
  expenseUpdates: boolean
  announcements: boolean
  chat: boolean
  notifyViaEmail: boolean
  notifyViaSms: boolean
}
```

---

## SMS Strategy (Twilio)

### SMS Types

| Type | Trigger | Message |
|------|---------|---------|
| Trip Invite | Organizer sends invite | "[Name] invited you to [Trip]! Join: [link]" |
| Trip Reminder | Day before trip | "Your trip [Trip] starts tomorrow!" |
| Wine Scoring Open | Event status → SCORING | "Wine scoring is now open! Score your wines: [link]" |
| Wine Results | Event status → COMPLETE | "Wine contest results are in! See who won: [link]" |
| Urgent Announcement | Priority = URGENT | "[Announcement title] - [preview]" |

### Rate Limiting

- Max 3 SMS per member per day (non-urgent)
- Urgent announcements bypass rate limit
- User can opt-out via notification preferences

---

## Payment Flow

### Stripe Integration

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Settle Expense │────▶│ Stripe Checkout │────▶│ Webhook Handler │
│  (Choose Card)  │     │    Session      │     │   /api/webhook  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Update Expense │
                                               │  Mark as Paid   │
                                               └─────────────────┘
```

### Payment Types

1. **Expense Settlement**: Guest pays their share via card
2. **Wine Bet (Cash)**: Record cash bet, show Venmo QR for payment
3. **Trip Contribution**: General trip cost contribution

### Venmo Integration

- Static Venmo QR code for Bob (from env var)
- Venmo deep link with pre-filled amount: `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amount}&note=${note}`
- Manual "Mark as Paid" button for cash payments

---

## Hood Bucks Virtual Currency

### Economy Design

```
Initial Balance: 1,000 Hood Bucks per guest per trip

Earning:
- Wine bet correct pick: 3x bet amount
- Bonus from organizer: Variable
- Trip awards: Variable

Spending:
- Wine contest bets: Variable
- Future: Activity bets, mini-games

Ledger:
- All transactions logged with type, amount, description
- Balance calculated from transaction sum
- Per-trip balances (optionally carry over)
```

### Transaction Types

```typescript
enum HoodBucksTransactionType {
  INITIAL_GRANT = 'initial_grant',
  BET_PLACED = 'bet_placed',
  BET_WON = 'bet_won',
  BET_LOST = 'bet_lost',
  BONUS = 'bonus',
  ADMIN_GRANT = 'admin_grant',
  TRIP_AWARD = 'trip_award'
}
```

---

## PWA Offline Strategy

### Cached Resources

| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets | Cache First | ∞ |
| Trip data | Stale While Revalidate | 5 min |
| Images | Cache First | 7 days |
| API calls | Network First | - |

### Offline Capabilities

- View trip details (cached)
- View itinerary (cached)
- View meal schedule (cached)
- View packing list (cached)
- Queue messages (sync when online)
- Queue RSVP changes (sync when online)

### Service Worker

```javascript
// next-pwa configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10
      }
    }
  ]
})
```

---

## Security Considerations

### Authentication

- Clerk handles organizer auth with secure JWT
- Guest tokens are cryptographically random (32 bytes)
- All tokens have expiration dates
- HTTP-only cookies for token storage

### Authorization

- Row-level checks on all API routes
- Organizer can access all trip data
- Guests can only access trips they're members of
- Guest capabilities limited by role

### Data Protection

- All API routes validate input with Zod
- SQL injection prevented by Prisma
- XSS prevented by React escaping
- CSRF protected by SameSite cookies

### Environment Variables

- All secrets in environment variables
- Different values for dev/staging/prod
- Vercel handles secure storage

---

## Performance Optimizations

### Database

- Indexes on foreign keys
- Indexes on frequently queried fields (tripId, memberId)
- Connection pooling via Prisma
- Query optimization with `select` and `include`

### Frontend

- React Query for data caching
- Optimistic updates for better UX
- Image optimization with next/image
- Code splitting per route
- Lazy loading of heavy components (maps, charts)

### API

- Edge runtime for latency-sensitive routes
- Response caching where appropriate
- Pagination for list endpoints
- Batch operations where possible

---

## Development Workflow

### Local Development

```bash
npm run dev          # Start Next.js dev server
npx prisma studio    # Open Prisma database UI
npx prisma migrate   # Run migrations
npx prisma generate  # Generate Prisma client
```

### Testing

```bash
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Deployment

```bash
git push origin main  # Auto-deploys to Vercel
npx vercel --prod    # Manual production deploy
```

---

## Monitoring & Logging

### Vercel Analytics

- Page views and performance
- Web Vitals (LCP, FID, CLS)
- Error tracking

### Logging

- API request/response logging
- Error logging with stack traces
- Audit logging for sensitive operations

---

## Future Considerations

1. **Mobile Apps**: React Native with shared business logic
2. **Multi-language**: i18n support for international trips
3. **Calendar Sync**: Google/Apple calendar integration
4. **Weather API**: Live weather forecasts for trip location
5. **Spotify Integration**: Collaborative trip playlists
6. **Split.wise Integration**: Alternative expense tracking
