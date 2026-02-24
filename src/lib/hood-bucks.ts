import prisma from "./prisma";
import { HoodBucksTransactionType } from "@/generated/prisma";

const INITIAL_BALANCE = 1000;
const BET_WIN_MULTIPLIER = 3;

export interface HoodBucksBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

// Get member's Hood Bucks balance for a trip
export async function getMemberBalance(memberId: string): Promise<HoodBucksBalance> {
  const member = await prisma.tripMember.findUnique({
    where: { id: memberId },
    select: { hoodBucksBalance: true },
  });

  const transactions = await prisma.hoodBucksTransaction.findMany({
    where: { memberId },
    select: { amount: true },
  });

  const totalEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return {
    balance: member?.hoodBucksBalance ?? 0,
    totalEarned,
    totalSpent,
  };
}

// Grant initial Hood Bucks when member joins a trip
export async function grantInitialBalance(
  memberId: string,
  tripId: string,
  userId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount: INITIAL_BALANCE,
        type: HoodBucksTransactionType.INITIAL_GRANT,
        description: "Welcome bonus for joining the trip",
      },
    }),
    prisma.tripMember.update({
      where: { id: memberId },
      data: { hoodBucksBalance: INITIAL_BALANCE },
    }),
  ]);
}

// Place a bet (deduct Hood Bucks)
export async function placeBet(
  memberId: string,
  tripId: string,
  betId: string,
  amount: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  // Check current balance
  const member = await prisma.tripMember.findUnique({
    where: { id: memberId },
    select: { hoodBucksBalance: true },
  });

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  if (member.hoodBucksBalance < amount) {
    return { success: false, error: "Insufficient Hood Bucks balance" };
  }

  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount: -amount,
        type: HoodBucksTransactionType.BET_PLACED,
        description: "Wine contest bet placed",
        relatedBetId: betId,
      },
    }),
    prisma.tripMember.update({
      where: { id: memberId },
      data: { hoodBucksBalance: { decrement: amount } },
    }),
  ]);

  return { success: true };
}

// Award winnings from a bet
export async function awardBetWinnings(
  memberId: string,
  tripId: string,
  betId: string,
  betAmount: number,
  userId?: string
): Promise<void> {
  const winnings = betAmount * BET_WIN_MULTIPLIER;

  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount: winnings,
        type: HoodBucksTransactionType.BET_WON,
        description: `Wine contest bet won (${BET_WIN_MULTIPLIER}x payout)`,
        relatedBetId: betId,
      },
    }),
    prisma.tripMember.update({
      where: { id: memberId },
      data: { hoodBucksBalance: { increment: winnings } },
    }),
    prisma.wineBet.update({
      where: { id: betId },
      data: {
        isCorrect: true,
        hoodBucksWon: winnings,
      },
    }),
  ]);
}

// Record a lost bet
export async function recordBetLoss(
  memberId: string,
  tripId: string,
  betId: string,
  userId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount: 0,
        type: HoodBucksTransactionType.BET_LOST,
        description: "Wine contest bet lost",
        relatedBetId: betId,
      },
    }),
    prisma.wineBet.update({
      where: { id: betId },
      data: {
        isCorrect: false,
        hoodBucksWon: 0,
      },
    }),
  ]);
}

// Admin grant (organizer gives bonus)
export async function grantBonus(
  memberId: string,
  tripId: string,
  amount: number,
  description: string,
  userId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount,
        type: HoodBucksTransactionType.ADMIN_GRANT,
        description,
      },
    }),
    prisma.tripMember.update({
      where: { id: memberId },
      data: { hoodBucksBalance: { increment: amount } },
    }),
  ]);
}

// Award trip achievement
export async function awardTripAchievement(
  memberId: string,
  tripId: string,
  amount: number,
  achievement: string,
  userId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.hoodBucksTransaction.create({
      data: {
        memberId,
        tripId,
        userId,
        amount,
        type: HoodBucksTransactionType.TRIP_AWARD,
        description: achievement,
      },
    }),
    prisma.tripMember.update({
      where: { id: memberId },
      data: { hoodBucksBalance: { increment: amount } },
    }),
  ]);
}

// Get transaction history for a member
export async function getTransactionHistory(
  memberId: string,
  tripId?: string,
  limit = 50
) {
  return prisma.hoodBucksTransaction.findMany({
    where: {
      memberId,
      ...(tripId ? { tripId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      trip: {
        select: { title: true },
      },
    },
  });
}

// Get leaderboard for a trip
export async function getTripLeaderboard(tripId: string) {
  const members = await prisma.tripMember.findMany({
    where: { tripId },
    select: {
      id: true,
      guestName: true,
      hoodBucksBalance: true,
      user: {
        select: { name: true, avatarUrl: true },
      },
    },
    orderBy: { hoodBucksBalance: "desc" },
  });

  return members.map((member, index) => ({
    rank: index + 1,
    memberId: member.id,
    name: member.user?.name ?? member.guestName ?? "Guest",
    avatarUrl: member.user?.avatarUrl,
    balance: member.hoodBucksBalance,
  }));
}

// Transfer Hood Bucks between members (future feature)
export async function transferHoodBucks(
  fromMemberId: string,
  toMemberId: string,
  tripId: string,
  amount: number,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const fromMember = await prisma.tripMember.findUnique({
    where: { id: fromMemberId },
    select: { hoodBucksBalance: true },
  });

  if (!fromMember || fromMember.hoodBucksBalance < amount) {
    return { success: false, error: "Insufficient balance" };
  }

  await prisma.$transaction([
    // Deduct from sender
    prisma.hoodBucksTransaction.create({
      data: {
        memberId: fromMemberId,
        tripId,
        amount: -amount,
        type: HoodBucksTransactionType.BONUS,
        description: note ? `Transfer: ${note}` : "Transfer to another member",
      },
    }),
    prisma.tripMember.update({
      where: { id: fromMemberId },
      data: { hoodBucksBalance: { decrement: amount } },
    }),
    // Add to receiver
    prisma.hoodBucksTransaction.create({
      data: {
        memberId: toMemberId,
        tripId,
        amount,
        type: HoodBucksTransactionType.BONUS,
        description: note ? `Received: ${note}` : "Received from another member",
      },
    }),
    prisma.tripMember.update({
      where: { id: toMemberId },
      data: { hoodBucksBalance: { increment: amount } },
    }),
  ]);

  return { success: true };
}

// Format Hood Bucks for display
export function formatHoodBucks(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

// Get transaction type display name
export function getTransactionTypeLabel(type: HoodBucksTransactionType): string {
  const labels: Record<HoodBucksTransactionType, string> = {
    INITIAL_GRANT: "Welcome Bonus",
    BET_PLACED: "Bet Placed",
    BET_WON: "Bet Won",
    BET_LOST: "Bet Lost",
    BONUS: "Bonus",
    ADMIN_GRANT: "Admin Grant",
    TRIP_AWARD: "Trip Award",
  };
  return labels[type];
}

// Get transaction type color
export function getTransactionTypeColor(type: HoodBucksTransactionType): string {
  const colors: Record<HoodBucksTransactionType, string> = {
    INITIAL_GRANT: "text-green-500",
    BET_PLACED: "text-amber-500",
    BET_WON: "text-green-500",
    BET_LOST: "text-red-500",
    BONUS: "text-purple-500",
    ADMIN_GRANT: "text-blue-500",
    TRIP_AWARD: "text-amber-500",
  };
  return colors[type];
}
