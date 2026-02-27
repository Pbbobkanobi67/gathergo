import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tripId: string; eventId: string }>;
}

// POST /api/trips/[tripId]/wine-events/[eventId]/reveal
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tripId, eventId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const isOrganizer = await isUserTripOrganizer(user.id, tripId);
    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the organizer can trigger reveal" } },
        { status: 403 }
      );
    }

    const event = await prisma.wineEvent.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: {
            submittedBy: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
        scores: true,
      },
    });

    if (!event || event.tripId !== tripId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Wine event not found" } },
        { status: 404 }
      );
    }

    if (event.status !== "SCORING") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Event must be in SCORING phase to reveal" } },
        { status: 400 }
      );
    }

    // Tally scores: 1st=3pts, 2nd=2pts, 3rd=1pt
    const pointsMap: Record<string, number> = {};
    const ratingsMap: Record<string, number[]> = {};

    for (const score of event.scores) {
      const rankings = score.rankings as { first?: string; second?: string; third?: string };
      if (rankings.first) pointsMap[rankings.first] = (pointsMap[rankings.first] || 0) + 3;
      if (rankings.second) pointsMap[rankings.second] = (pointsMap[rankings.second] || 0) + 2;
      if (rankings.third) pointsMap[rankings.third] = (pointsMap[rankings.third] || 0) + 1;

      const tasteNotes = score.tasteNotes as Record<string, { rating: number }>;
      for (const [entryId, note] of Object.entries(tasteNotes)) {
        if (!ratingsMap[entryId]) ratingsMap[entryId] = [];
        ratingsMap[entryId].push(note.rating);
      }
    }

    // Sort entries by points (desc), tiebreaker: avg rating (desc)
    const sortedEntries = event.entries
      .filter((e) => e.bagNumber !== null)
      .map((e) => {
        const points = pointsMap[e.id] || 0;
        const ratings = ratingsMap[e.id] || [];
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return { ...e, points, avgRating };
      })
      .sort((a, b) => b.points - a.points || b.avgRating - a.avgRating);

    // Assign places (1, 2, 3)
    const updates = [];
    for (let i = 0; i < sortedEntries.length; i++) {
      const place = i < 3 ? i + 1 : null;
      updates.push(
        prisma.wineEntry.update({
          where: { id: sortedEntries[i].id },
          data: { isRevealed: true, finalPlace: place },
        })
      );
    }

    // Also reveal entries without bag numbers
    for (const e of event.entries.filter((e) => e.bagNumber === null)) {
      updates.push(
        prisma.wineEntry.update({
          where: { id: e.id },
          data: { isRevealed: true },
        })
      );
    }

    // Resolve bets
    const bets = await prisma.wineBet.findMany({ where: { wineEventId: eventId } });
    const first = sortedEntries[0]?.id;
    const second = sortedEntries[1]?.id;
    const third = sortedEntries[2]?.id;

    const betUpdates = [];
    for (const bet of bets) {
      let correctPicks = 0;
      if (bet.predictedFirst === first) correctPicks++;
      if (bet.predictedSecond === second) correctPicks++;
      if (bet.predictedThird === third) correctPicks++;

      const isCorrect = correctPicks >= 2;
      const hoodBucksWon = isCorrect ? bet.betAmountHoodBucks * 3 : 0;
      const cashWon = isCorrect ? bet.betAmountCash * 3 : 0;

      betUpdates.push(
        prisma.wineBet.update({
          where: { id: bet.id },
          data: { isCorrect, hoodBucksWon, cashWon },
        })
      );

      // Credit/debit hood bucks
      if (isCorrect && hoodBucksWon > 0) {
        betUpdates.push(
          prisma.tripMember.update({
            where: { id: bet.memberId },
            data: { hoodBucksBalance: { increment: hoodBucksWon } },
          })
        );
        betUpdates.push(
          prisma.hoodBucksTransaction.create({
            data: {
              memberId: bet.memberId,
              userId: bet.userId,
              tripId,
              amount: hoodBucksWon,
              type: "BET_WON",
              description: `Won tasting contest bet`,
              relatedBetId: bet.id,
            },
          })
        );
      }
    }

    // Update event status
    updates.push(
      prisma.wineEvent.update({
        where: { id: eventId },
        data: { status: "REVEAL", revealedAt: new Date() },
      })
    );

    await prisma.$transaction([...updates, ...betUpdates]);

    // Build results
    const results = {
      winner: sortedEntries[0] ? {
        entryId: sortedEntries[0].id,
        bagNumber: sortedEntries[0].bagNumber,
        wineName: sortedEntries[0].wineName,
        winery: sortedEntries[0].winery,
        points: sortedEntries[0].points,
        avgRating: sortedEntries[0].avgRating,
        submittedBy: sortedEntries[0].submittedBy,
      } : null,
      second: sortedEntries[1] ? {
        entryId: sortedEntries[1].id,
        bagNumber: sortedEntries[1].bagNumber,
        wineName: sortedEntries[1].wineName,
        winery: sortedEntries[1].winery,
        points: sortedEntries[1].points,
        avgRating: sortedEntries[1].avgRating,
        submittedBy: sortedEntries[1].submittedBy,
      } : null,
      third: sortedEntries[2] ? {
        entryId: sortedEntries[2].id,
        bagNumber: sortedEntries[2].bagNumber,
        wineName: sortedEntries[2].wineName,
        winery: sortedEntries[2].winery,
        points: sortedEntries[2].points,
        avgRating: sortedEntries[2].avgRating,
        submittedBy: sortedEntries[2].submittedBy,
      } : null,
      totalScores: event.scores.length,
      totalEntries: sortedEntries.length,
    };

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("POST reveal error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to reveal results" } },
      { status: 500 }
    );
  }
}
