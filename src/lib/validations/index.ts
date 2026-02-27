import { z } from "zod";

// Common validators
const emailSchema = z.string().email("Please enter a valid email address");
const phoneSchema = z.string().regex(/^\+?[\d\s-()]{10,}$/, "Please enter a valid phone number").optional().or(z.literal(""));
const urlSchema = z.string().url("Please enter a valid URL").optional().or(z.literal(""));
const dateSchema = z.coerce.date();

// User/Guest validation
export const guestJoinSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: emailSchema,
  phone: phoneSchema,
  dietaryRestrictions: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  isCouple: z.boolean(),
  couplePartnerName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type GuestJoinInput = z.infer<typeof guestJoinSchema>;

// Trip validation (base schema without refinement)
const tripBaseSchema = z.object({
  title: z.string().min(1, "Trip title is required").max(100, "Title is too long"),
  type: z.enum(["CABIN", "CRUISE", "ROAD_TRIP", "DAY_TRIP", "INTERNATIONAL", "OTHER"]),
  description: z.string().max(2000).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  timezone: z.string().default("America/Los_Angeles"),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  coverImageUrl: urlSchema,
  airbnbConfirmationCode: z.string().max(50).optional().nullable(),
  airbnbUrl: urlSchema.nullable(),
  status: z.enum(["PLANNING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const tripCreateSchema = tripBaseSchema.omit({ status: true }).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;

export const tripUpdateSchema = tripBaseSchema.partial();
export type TripUpdateInput = z.infer<typeof tripUpdateSchema>;

// Activity validation
export const activityCreateSchema = z.object({
  tripId: z.string().cuid(),
  itineraryDayId: z.string().cuid().optional(),
  title: z.string().min(1, "Activity title is required").max(200),
  description: z.string().max(2000).optional(),
  startTime: dateSchema.optional(),
  endTime: dateSchema.optional(),
  location: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.enum([
    "DINING", "ADVENTURE", "RELAXATION", "SHOPPING", "TRAVEL",
    "CHECK_IN", "CHECK_OUT", "MEALS", "GAMES", "MOVIES",
    "SPORTS", "NIGHTLIFE", "SIGHTSEEING", "ENTERTAINMENT", "WELLNESS", "OTHER",
  ]).default("OTHER"),
  reservationUrl: urlSchema,
  confirmationCode: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  paidBy: z.string().max(100).optional(),
  assignedToMemberId: z.string().cuid().optional(),
  linkedMealId: z.string().cuid().optional().nullable(),
  linkedWineEventId: z.string().cuid().optional().nullable(),
});

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;

// Activity RSVP validation
export const activityRsvpSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1, "Select at least one member"),
});

export type ActivityRsvpInput = z.infer<typeof activityRsvpSchema>;

export const activityRsvpResponseSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "MAYBE"]),
});

export type ActivityRsvpResponseInput = z.infer<typeof activityRsvpResponseSchema>;

// Meal validation
export const mealNightCreateSchema = z.object({
  tripId: z.string().cuid(),
  date: dateSchema,
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  assignedToMemberId: z.string().cuid().optional(),
  assignedCoupleName: z.string().max(200).optional(),
  servings: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type MealNightCreateInput = z.infer<typeof mealNightCreateSchema>;

// Recipe validation
export const recipeIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.union([z.string(), z.number()]),
  unit: z.string(),
  notes: z.string().optional(),
});

export const recipeInstructionSchema = z.object({
  step: z.number().int().min(1),
  text: z.string().min(1, "Instruction text is required"),
  timerMinutes: z.number().int().min(0).optional(),
});

export const recipeCreateSchema = z.object({
  mealNightId: z.string().cuid(),
  title: z.string().min(1, "Recipe title is required").max(200),
  description: z.string().max(2000).optional(),
  servings: z.number().int().min(1).max(100).default(4),
  prepTimeMinutes: z.number().int().min(0).max(1440).optional(),
  cookTimeMinutes: z.number().int().min(0).max(1440).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  imageUrl: urlSchema,
  sourceUrl: urlSchema,
  ingredients: z.array(recipeIngredientSchema).default([]),
  instructions: z.array(recipeInstructionSchema).default([]),
});

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;

// Shopping item validation
export const shoppingItemCreateSchema = z.object({
  tripId: z.string().cuid(),
  mealNightId: z.string().cuid().optional(),
  name: z.string().min(1, "Item name is required").max(200),
  quantity: z.number().min(0).default(1),
  unit: z.string().max(50).optional(),
  category: z.enum(["PRODUCE", "MEAT", "DAIRY", "BAKERY", "FROZEN", "PANTRY", "BEVERAGES", "SNACKS", "HOUSEHOLD", "OTHER"]).default("OTHER"),
  estimatedCost: z.number().min(0).optional(),
  assignedToMemberId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

export type ShoppingItemCreateInput = z.infer<typeof shoppingItemCreateSchema>;

// Packing item validation
export const packingItemCreateSchema = z.object({
  tripId: z.string().cuid(),
  category: z.enum(["CLOTHING", "TOILETRIES", "FOOD_AND_DRINKS", "GEAR", "ENTERTAINMENT", "FIRST_AID", "DOCUMENTS", "ELECTRONICS", "OTHER"]).default("OTHER"),
  name: z.string().min(1, "Item name is required").max(200),
  quantity: z.number().int().min(1).max(100).default(1),
  forEveryone: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type PackingItemCreateInput = z.infer<typeof packingItemCreateSchema>;

// Wine event validation
export const wineEventCreateSchema = z.object({
  tripId: z.string().cuid(),
  title: z.string().min(1, "Event title is required").max(200),
  date: dateSchema,
  contestType: z.string().default("WINE"),
  entriesPerPerson: z.number().int().min(1).max(10).default(3),
  instructions: z.string().max(2000).optional().nullable(),
  priceRangeMin: z.number().min(0).default(4),
  priceRangeMax: z.number().min(0).default(40),
  hoodBucksPotSize: z.number().int().min(0).default(500),
  allowCashBets: z.boolean().default(true),
}).refine((data) => data.priceRangeMax >= data.priceRangeMin, {
  message: "Max price must be greater than min price",
  path: ["priceRangeMax"],
});

export type WineEventCreateInput = z.infer<typeof wineEventCreateSchema>;

// Wine entry validation
export const wineEntryCreateSchema = z.object({
  wineEventId: z.string().cuid(),
  wineName: z.string().min(1, "Wine name is required").max(200),
  winery: z.string().max(200).optional(),
  vintage: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  varietal: z.string().max(100).optional(),
  price: z.number().min(0, "Price is required"),
  imageUrl: urlSchema,
  notes: z.string().max(1000).optional(),
});

export type WineEntryCreateInput = z.infer<typeof wineEntryCreateSchema>;

// Wine score validation
export const wineScoreCreateSchema = z.object({
  wineEventId: z.string().cuid(),
  rankings: z.object({
    first: z.string().cuid(),
    second: z.string().cuid(),
    third: z.string().cuid(),
  }),
  tasteNotes: z.record(z.string(), z.object({
    rating: z.number().int().min(1).max(5),
    notes: z.string().max(500).optional(),
  })),
});

export type WineScoreCreateInput = z.infer<typeof wineScoreCreateSchema>;

// Wine bet validation
export const wineBetCreateSchema = z.object({
  wineEventId: z.string().cuid(),
  predictedFirst: z.string().cuid(),
  predictedSecond: z.string().cuid(),
  predictedThird: z.string().cuid(),
  betAmountHoodBucks: z.number().int().min(0).default(0),
  betAmountCash: z.number().min(0).default(0),
}).refine((data) => data.betAmountHoodBucks > 0 || data.betAmountCash > 0, {
  message: "You must bet at least some Hood Bucks or cash",
  path: ["betAmountHoodBucks"],
});

export type WineBetCreateInput = z.infer<typeof wineBetCreateSchema>;

// Bag assignment validation
export const bagAssignmentSchema = z.object({
  assignments: z.array(z.object({
    entryId: z.string().cuid(),
    bagNumber: z.number().int().min(1),
  })).min(1),
});

export type BagAssignmentInput = z.infer<typeof bagAssignmentSchema>;

// Expense validation
export const expenseCreateSchema = z.object({
  tripId: z.string().cuid(),
  title: z.string().min(1, "Expense title is required").max(200),
  category: z.enum(["GROCERIES", "GAS", "DINING", "ACTIVITIES", "ACCOMMODATION", "OTHER"]).default("OTHER"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
  date: dateSchema.optional(),
  splitType: z.enum(["EQUAL", "CUSTOM", "ORGANIZER_ONLY"]).default("EQUAL"),
  receiptImageUrl: urlSchema,
  notes: z.string().max(1000).optional(),
  splits: z.array(z.object({
    memberId: z.string().cuid(),
    amount: z.number().min(0),
  })).optional(),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;

// Announcement validation
export const announcementCreateSchema = z.object({
  tripId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Message body is required").max(5000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  sendViaEmail: z.boolean().default(false),
  sendViaSms: z.boolean().default(false),
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

// Document validation
export const documentCreateSchema = z.object({
  tripId: z.string().cuid(),
  title: z.string().min(1, "Document title is required").max(200),
  category: z.enum(["RESERVATION", "BOARDING_PASS", "ITINERARY", "INSURANCE", "OTHER"]).default("OTHER"),
  fileUrl: z.string().url("Invalid file URL"),
  fileType: z.string().optional(),
});

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;

// Chat message validation
export const chatMessageCreateSchema = z.object({
  tripId: z.string().cuid(),
  message: z.string().min(1, "Message cannot be empty").max(2000),
  imageUrl: urlSchema,
});

export type ChatMessageCreateInput = z.infer<typeof chatMessageCreateSchema>;

// Photo validation
export const photoCreateSchema = z.object({
  tripId: z.string().cuid(),
  imageUrl: z.string().url("Invalid image URL"),
  caption: z.string().max(500).optional(),
  takenAt: dateSchema.optional(),
});

export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

// Notification preferences validation
export const notificationPrefsSchema = z.object({
  tripUpdates: z.boolean(),
  mealChanges: z.boolean(),
  activityVotes: z.boolean(),
  wineContest: z.boolean(),
  expenseUpdates: z.boolean(),
  announcements: z.boolean(),
  chat: z.boolean(),
  notifyViaEmail: z.boolean(),
  notifyViaSms: z.boolean(),
});

export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;

// Hood Bucks grant validation
export const hoodBucksGrantSchema = z.object({
  memberId: z.string().cuid(),
  amount: z.number().int().min(1, "Amount must be at least 1"),
  description: z.string().min(1, "Description is required").max(500),
});

export type HoodBucksGrantInput = z.infer<typeof hoodBucksGrantSchema>;

// RSVP update validation
export const rsvpUpdateSchema = z.object({
  rsvpStatus: z.enum(["PENDING", "CONFIRMED", "MAYBE", "DECLINED"]),
});

export type RsvpUpdateInput = z.infer<typeof rsvpUpdateSchema>;

// Member update validation
export const memberUpdateSchema = z.object({
  guestName: z.string().min(1).max(100).optional(),
  guestPhone: phoneSchema,
  dietaryRestrictions: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  isCouple: z.boolean().optional(),
  couplePartnerName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  role: z.enum(["ORGANIZER", "CO_ORGANIZER", "GUEST"]).optional(),
  notifPrefs: notificationPrefsSchema.optional(),
});

export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

// Admin validation schemas
export const adminUserUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional(),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const adminTripUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  status: z.enum(["PLANNING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export type AdminTripUpdateInput = z.infer<typeof adminTripUpdateSchema>;

// Activity log admin edit
export const activityLogUpdateSchema = z.object({
  action: z.string().min(1, "Action text is required").max(500),
});

export type ActivityLogUpdateInput = z.infer<typeof activityLogUpdateSchema>;

// AI Chat validation
export const aiChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
