// Trip Types
export const TRIP_TYPES = [
  { value: "CABIN", label: "Cabin Trip", icon: "🏠", description: "Mountain getaway with friends" },
  { value: "CRUISE", label: "Cruise", icon: "🚢", description: "Sailing adventure" },
  { value: "ROAD_TRIP", label: "Road Trip", icon: "🚗", description: "Hit the open road" },
  { value: "DAY_TRIP", label: "Day Trip", icon: "☀️", description: "Quick adventure" },
  { value: "INTERNATIONAL", label: "International", icon: "✈️", description: "World travel" },
  { value: "OTHER", label: "Other", icon: "🎒", description: "Custom adventure" },
] as const;

// Trip Statuses
export const TRIP_STATUSES = [
  { value: "PLANNING", label: "Planning", color: "bg-amber-500" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-500" },
  { value: "ACTIVE", label: "Active", color: "bg-teal-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-slate-500" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-500" },
] as const;

// RSVP Statuses
export const RSVP_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-slate-500", icon: "⏳" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-500", icon: "✓" },
  { value: "MAYBE", label: "Maybe", color: "bg-amber-500", icon: "?" },
  { value: "DECLINED", label: "Declined", color: "bg-red-500", icon: "✕" },
] as const;

// Member Roles
export const MEMBER_ROLES = [
  { value: "ORGANIZER", label: "Organizer", permissions: ["all"] },
  { value: "CO_ORGANIZER", label: "Co-Organizer", permissions: ["edit", "invite", "announce"] },
  { value: "GUEST", label: "Guest", permissions: ["view", "vote", "chat"] },
] as const;

// Activity Categories
export const ACTIVITY_CATEGORIES = [
  { value: "DINING", label: "Dining", icon: "🍽️", color: "bg-orange-500" },
  { value: "ADVENTURE", label: "Adventure", icon: "🏔️", color: "bg-green-500" },
  { value: "RELAXATION", label: "Relaxation", icon: "🧘", color: "bg-blue-500" },
  { value: "SHOPPING", label: "Shopping", icon: "🛍️", color: "bg-pink-500" },
  { value: "TRAVEL", label: "Travel", icon: "🚗", color: "bg-purple-500" },
  { value: "OTHER", label: "Other", icon: "📌", color: "bg-slate-500" },
] as const;

// Activity Statuses
export const ACTIVITY_STATUSES = [
  { value: "IDEA", label: "Idea", color: "bg-slate-500" },
  { value: "VOTING", label: "Voting", color: "bg-amber-500" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-teal-500" },
] as const;

// Meal Types
export const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Breakfast", icon: "🍳", time: "8:00 AM" },
  { value: "LUNCH", label: "Lunch", icon: "🥪", time: "12:00 PM" },
  { value: "DINNER", label: "Dinner", icon: "🍝", time: "6:00 PM" },
  { value: "SNACKS", label: "Snacks", icon: "🍿", time: "Anytime" },
] as const;

// Meal Statuses
export const MEAL_STATUSES = [
  { value: "UNASSIGNED", label: "Unassigned", color: "bg-slate-500" },
  { value: "ASSIGNED", label: "Assigned", color: "bg-amber-500" },
  { value: "PLANNED", label: "Planned", color: "bg-blue-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-500" },
] as const;

// Recipe Difficulties
export const RECIPE_DIFFICULTIES = [
  { value: "EASY", label: "Easy", color: "text-green-500" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-500" },
  { value: "HARD", label: "Hard", color: "text-red-500" },
] as const;

// Shopping Categories
export const SHOPPING_CATEGORIES = [
  { value: "PRODUCE", label: "Produce", icon: "🥬" },
  { value: "MEAT", label: "Meat & Seafood", icon: "🥩" },
  { value: "DAIRY", label: "Dairy", icon: "🧀" },
  { value: "BAKERY", label: "Bakery", icon: "🍞" },
  { value: "FROZEN", label: "Frozen", icon: "🧊" },
  { value: "PANTRY", label: "Pantry", icon: "🥫" },
  { value: "BEVERAGES", label: "Beverages", icon: "🥤" },
  { value: "SNACKS", label: "Snacks", icon: "🍿" },
  { value: "HOUSEHOLD", label: "Household", icon: "🧹" },
  { value: "OTHER", label: "Other", icon: "📦" },
] as const;

// Packing Categories
export const PACKING_CATEGORIES = [
  { value: "CLOTHING", label: "Clothing", icon: "👕" },
  { value: "TOILETRIES", label: "Toiletries", icon: "🧴" },
  { value: "FOOD_AND_DRINKS", label: "Food & Drinks", icon: "🍕" },
  { value: "GEAR", label: "Gear", icon: "🎿" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: "🎲" },
  { value: "FIRST_AID", label: "First Aid", icon: "🩹" },
  { value: "DOCUMENTS", label: "Documents", icon: "📄" },
  { value: "ELECTRONICS", label: "Electronics", icon: "📱" },
  { value: "OTHER", label: "Other", icon: "📦" },
] as const;

// Wine Event Statuses
export const WINE_EVENT_STATUSES = [
  { value: "SETUP", label: "Setup", color: "bg-slate-500", description: "Configuring event" },
  { value: "OPEN", label: "Open", color: "bg-blue-500", description: "Accepting entries" },
  { value: "SCORING", label: "Scoring", color: "bg-amber-500", description: "Taste and rate" },
  { value: "REVEAL", label: "Reveal", color: "bg-purple-500", description: "Revealing wines" },
  { value: "COMPLETE", label: "Complete", color: "bg-green-500", description: "Results final" },
] as const;

// Wine Varietals
export const WINE_VARIETALS = [
  "Cabernet Sauvignon",
  "Merlot",
  "Pinot Noir",
  "Syrah/Shiraz",
  "Zinfandel",
  "Malbec",
  "Sangiovese",
  "Tempranillo",
  "Chardonnay",
  "Sauvignon Blanc",
  "Pinot Grigio",
  "Riesling",
  "Moscato",
  "Rosé",
  "Sparkling",
  "Champagne",
  "Prosecco",
  "Red Blend",
  "White Blend",
  "Other",
] as const;

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: "GROCERIES", label: "Groceries", icon: "🛒", color: "bg-green-500" },
  { value: "GAS", label: "Gas", icon: "⛽", color: "bg-amber-500" },
  { value: "DINING", label: "Dining", icon: "🍽️", color: "bg-orange-500" },
  { value: "ACTIVITIES", label: "Activities", icon: "🎯", color: "bg-blue-500" },
  { value: "ACCOMMODATION", label: "Accommodation", icon: "🏠", color: "bg-purple-500" },
  { value: "OTHER", label: "Other", icon: "💰", color: "bg-slate-500" },
] as const;

// Split Types
export const SPLIT_TYPES = [
  { value: "EQUAL", label: "Split Equally", description: "Divide evenly among all members" },
  { value: "CUSTOM", label: "Custom Split", description: "Set individual amounts" },
  { value: "ORGANIZER_ONLY", label: "Organizer Pays", description: "No split needed" },
] as const;

// Announcement Priorities
export const ANNOUNCEMENT_PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-slate-500", icon: "📢" },
  { value: "NORMAL", label: "Normal", color: "bg-blue-500", icon: "📣" },
  { value: "HIGH", label: "High", color: "bg-amber-500", icon: "⚠️" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500", icon: "🚨" },
] as const;

// Document Categories
export const DOCUMENT_CATEGORIES = [
  { value: "RESERVATION", label: "Reservation", icon: "📋" },
  { value: "BOARDING_PASS", label: "Boarding Pass", icon: "✈️" },
  { value: "ITINERARY", label: "Itinerary", icon: "📅" },
  { value: "INSURANCE", label: "Insurance", icon: "🛡️" },
  { value: "OTHER", label: "Other", icon: "📄" },
] as const;

// US Timezones
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
] as const;

// Hood Bucks
export const HOOD_BUCKS = {
  INITIAL_BALANCE: 1000,
  BET_WIN_MULTIPLIER: 3,
  CURRENCY_SYMBOL: "HB",
  CURRENCY_ICON: "🍺",
} as const;

// App Colors (matching design system)
export const COLORS = {
  primary: "#0D6B6B",
  secondary: "#F59E0B",
  accent: "#F97316",
  background: "#0F172A",
  surface: "#1E293B",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  purple: "#7C3AED",
} as const;

// Wine rating labels
export const WINE_RATINGS = [
  { value: 1, label: "Poor", emoji: "😕" },
  { value: 2, label: "Fair", emoji: "😐" },
  { value: 3, label: "Good", emoji: "🙂" },
  { value: 4, label: "Very Good", emoji: "😊" },
  { value: 5, label: "Excellent", emoji: "🤩" },
] as const;

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFS = {
  tripUpdates: true,
  mealChanges: true,
  activityVotes: true,
  wineContest: true,
  expenseUpdates: true,
  announcements: true,
  chat: true,
  notifyViaEmail: true,
  notifyViaSms: false,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],
  MAX_IMAGES_PER_UPLOAD: 10,
} as const;

// Activity Log Types
export const ACTIVITY_LOG_TYPES = [
  { value: "EXPENSE_ADDED", label: "Expense Added", icon: "DollarSign", color: "text-green-400" },
  { value: "EXPENSE_UPDATED", label: "Expense Updated", icon: "DollarSign", color: "text-amber-400" },
  { value: "EXPENSE_DELETED", label: "Expense Deleted", icon: "DollarSign", color: "text-red-400" },
  { value: "MEAL_CREATED", label: "Meal Created", icon: "Utensils", color: "text-orange-400" },
  { value: "MEAL_ASSIGNED", label: "Meal Assigned", icon: "Utensils", color: "text-orange-400" },
  { value: "MEAL_UPDATED", label: "Meal Updated", icon: "Utensils", color: "text-amber-400" },
  { value: "MEMBER_JOINED", label: "Member Joined", icon: "UserPlus", color: "text-teal-400" },
  { value: "MEMBER_LEFT", label: "Member Left", icon: "UserMinus", color: "text-red-400" },
  { value: "WINE_EVENT_CREATED", label: "Wine Event Created", icon: "Wine", color: "text-purple-400" },
  { value: "WINE_ENTRY_SUBMITTED", label: "Wine Entry Submitted", icon: "Wine", color: "text-purple-400" },
  { value: "WINE_SCORE_SUBMITTED", label: "Wine Score Submitted", icon: "Wine", color: "text-purple-400" },
  { value: "WINE_BET_PLACED", label: "Wine Bet Placed", icon: "Trophy", color: "text-amber-400" },
  { value: "ACTIVITY_ADDED", label: "Activity Added", icon: "Calendar", color: "text-blue-400" },
  { value: "ACTIVITY_VOTED", label: "Activity Voted", icon: "ThumbsUp", color: "text-blue-400" },
  { value: "PACKING_ITEM_ADDED", label: "Packing Item Added", icon: "Package", color: "text-slate-400" },
  { value: "PHOTO_UPLOADED", label: "Photo Uploaded", icon: "Camera", color: "text-pink-400" },
  { value: "DOCUMENT_UPLOADED", label: "Document Uploaded", icon: "FileText", color: "text-slate-400" },
  { value: "TRIP_UPDATED", label: "Trip Updated", icon: "Settings", color: "text-teal-400" },
  { value: "TRIP_CREATED", label: "Trip Created", icon: "MapPin", color: "text-teal-400" },
  { value: "ANNOUNCEMENT_POSTED", label: "Announcement", icon: "Bell", color: "text-amber-400" },
  { value: "HOOD_BUCKS_GRANTED", label: "Hood Bucks Granted", icon: "Trophy", color: "text-amber-400" },
  { value: "RECIPE_ADDED", label: "Recipe Added", icon: "ChefHat", color: "text-orange-400" },
] as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
