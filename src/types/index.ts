// Re-export Prisma types
export type {
  User,
  Trip,
  TripMember,
  ItineraryDay,
  Activity,
  ActivityVote,
  MealNight,
  Recipe,
  ShoppingItem,
  PackingItem,
  WineEvent,
  WineEntry,
  WineScore,
  WineBet,
  Expense,
  ExpenseSplit,
  Announcement,
  TripDocument,
  ChatMessage,
  TripPhoto,
  HoodBucksTransaction,
  Payment,
  ActivityLog,
} from "@/generated/prisma";

export {
  TripType,
  TripStatus,
  MemberRole,
  RsvpStatus,
  ActivityCategory,
  ActivityStatus,
  VoteType,
  MealType,
  MealStatus,
  RecipeDifficulty,
  ShoppingCategory,
  PackingCategory,
  WineEventStatus,
  PaymentStatus,
  ExpenseCategory,
  SplitType,
  AnnouncementPriority,
  DocumentCategory,
  HoodBucksTransactionType,
  StripePaymentStatus,
  ActivityLogType,
} from "@/generated/prisma";

// Hood Bucks Balance
export interface HoodBucksBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Trip with relations
export interface TripWithDetails {
  id: string;
  title: string;
  type: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  timezone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  airbnbConfirmationCode: string | null;
  airbnbUrl: string | null;
  status: string;
  inviteToken: string;
  createdAt: Date;
  updatedAt: Date;
  organizer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  members: TripMemberSummary[];
  _count: {
    members: number;
    mealNights: number;
    wineEvents: number;
    expenses: number;
  };
}

export interface TripMemberSummary {
  id: string;
  guestName: string | null;
  guestEmail: string | null;
  role: string;
  rsvpStatus: string;
  isCouple: boolean;
  couplePartnerName: string | null;
  hoodBucksBalance: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

// Wine Event with relations
export interface WineEventWithDetails {
  id: string;
  title: string;
  date: Date;
  status: string;
  priceRangeMin: number;
  priceRangeMax: number;
  bottleCount: number;
  contestType: string;
  entriesPerPerson: number;
  instructions: string | null;
  hoodBucksPotSize: number;
  allowCashBets: boolean;
  revealedAt: Date | null;
  createdAt: Date;
  entries: WineEntryWithSubmitter[];
  scores: WineScoreSummary[];
  bets: WineBetSummary[];
  _count: {
    entries: number;
    scores: number;
    bets: number;
  };
}

export interface WineEntryWithSubmitter {
  id: string;
  bagNumber: number | null;
  wineName: string;
  winery: string | null;
  vintage: number | null;
  varietal: string | null;
  price: number;
  imageUrl: string | null;
  isRevealed: boolean;
  finalPlace: number | null;
  notes: string | null;
  submittedByMemberId: string | null;
  submittedBy: TripMemberSummary | null;
}

export interface WineScoreSummary {
  id: string;
  rankings: WineRankings;
  tasteNotes: Record<string, WineTasteNote>;
  submittedAt: Date | null;
  member: TripMemberSummary;
}

export interface WineRankings {
  first: string | null;
  second: string | null;
  third: string | null;
}

export interface WineTasteNote {
  rating: number;
  notes: string;
}

export interface WineBetSummary {
  id: string;
  predictedFirst: string | null;
  predictedSecond: string | null;
  predictedThird: string | null;
  betAmountHoodBucks: number;
  betAmountCash: number;
  paymentStatus: string;
  isCorrect: boolean | null;
  hoodBucksWon: number;
  cashWon: number;
  member: TripMemberSummary;
}

// Recipe types
export interface RecipeIngredient {
  name: string;
  amount: number | string;
  unit: string;
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  text: string;
  timerMinutes?: number;
}

// Expense with splits
export interface ExpenseWithSplits {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: Date;
  splitType: string;
  receiptImageUrl: string | null;
  notes: string | null;
  paidByUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  splits: ExpenseSplitWithMember[];
}

export interface ExpenseSplitWithMember {
  id: string;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
  member: TripMemberSummary;
}

// Balance summary for expenses
export interface BalanceSummary {
  memberId: string;
  memberName: string;
  owes: { memberId: string; memberName: string; amount: number }[];
  isOwed: { memberId: string; memberName: string; amount: number }[];
  netBalance: number;
}

// Notification preferences
export interface NotificationPrefs {
  tripUpdates: boolean;
  mealChanges: boolean;
  activityVotes: boolean;
  wineContest: boolean;
  expenseUpdates: boolean;
  announcements: boolean;
  chat: boolean;
  notifyViaEmail: boolean;
  notifyViaSms: boolean;
}

// Guest join form data
export interface GuestJoinData {
  name: string;
  email: string;
  phone?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  isCouple: boolean;
  couplePartnerName?: string;
  notes?: string;
}

// Trip create/update form data
export interface TripFormData {
  title: string;
  type: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  timezone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  airbnbConfirmationCode?: string;
  airbnbUrl?: string;
}

// Meal assignment
export interface MealAssignment {
  mealNightId: string;
  memberId: string;
  coupleName?: string;
}

// Wine scoring form
export interface WineScoringForm {
  rankings: {
    first: string;
    second: string;
    third: string;
  };
  tasteNotes: Record<string, { rating: number; notes: string }>;
}

// Wine bet form
export interface WineBetForm {
  predictedFirst: string;
  predictedSecond: string;
  predictedThird: string;
  betAmountHoodBucks: number;
  betAmountCash: number;
}

// Venmo payment info
export interface VenmoPaymentInfo {
  handle: string;
  amount: number;
  note: string;
  deepLink: string;
  webLink: string;
  qrCodeUrl?: string;
}

// Weather data (from API)
export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  description: string;
  icon: string;
  precipitation: number;
}

// Real-time event payloads
export interface RealtimeEvent<T = unknown> {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: T;
  old_record?: T;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalExpenses: number;
  recentSignups: number;
  totalExpenseVolume: number;
  tripsByStatus: { status: string; count: number }[];
}

export interface AdminUserListItem {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: Date;
  _count: {
    organizedTrips: number;
    tripMemberships: number;
  };
}

export interface AdminTripListItem {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
  city: string | null;
  state: string | null;
  createdAt: Date;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    expenses: number;
  };
}

export interface CurrentUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

// Session/auth types
export interface GuestSession {
  memberId: string;
  tripId: string;
  guestToken: string;
  guestName: string;
  guestEmail: string;
}

export interface UserSession {
  userId: string;
  clerkId: string;
  email: string;
  name: string;
}

// Activity Log types
export interface ActivityLogItem {
  id: string;
  tripId: string;
  userId: string | null;
  type: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

// AI Chat types
export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatResponse {
  message: string;
}
