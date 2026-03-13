import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isUserTripOrganizer } from "@/lib/clerk";
import prisma from "@/lib/prisma";
import { awardTastingPot } from "@/lib/hood-bucks";
import { TASTING_POT_SPLIT } from "@/constants";

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
        scores: {
          include: {
            member: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
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

    // =========================================================
    // 1. Compute avg score per bottle from all voters' tasteNotes
    // =========================================================
    const ratingsMap: Record<string, number[]> = {};
    for (const entry of event.entries) {
      ratingsMap[entry.id] = [];
    }

    for (const score of event.scores) {
      const tasteNotes = score.tasteNotes as Record<string, { rating: number }>;
      for (const [entryId, note] of Object.entries(tasteNotes)) {
        if (ratingsMap[entryId] && note.rating > 0) {
          ratingsMap[entryId].push(note.rating);
        }
      }
    }

    // 2. Sort by avgScore desc -> assign finalPlace 1/2/3
    const scoredEntries = event.entries
      .filter((e) => e.bagNumber !== null)
      .map((e) => {
        const ratings = ratingsMap[e.id] || [];
        const avgScore = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
        return { ...e, avgScore, totalVoters: ratings.length };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    // =========================================================
    // 3. Compute Best Palate: Spearman footrule distance
    // =========================================================
    // Group ranking = sorted by avgScore desc -> rank 1,2,3...
    const groupRanking: Record<string, number> = {};
    scoredEntries.forEach((e, i) => {
      groupRanking[e.id] = i + 1;
    });

    let bestPalateMemberId: string | null = null;
    let bestPalateScore: number | null = null;
    let bestPalateName = "";
    let bestPalateAvatarUrl: string | null = null;

    if (event.scores.length > 0 && scoredEntries.length >= 3) {
      for (const score of event.scores) {
        const tasteNotes = score.tasteNotes as Record<string, { rating: number }>;

        // Derive voter's personal ranking from their scores
        const voterScores = scoredEntries
          .filter((e) => tasteNotes[e.id]?.rating > 0)
          .map((e) => ({ entryId: e.id, rating: tasteNotes[e.id].rating }))
          .sort((a, b) => b.rating - a.rating);

        // Compute Spearman footrule distance: sum(|voter_rank - group_rank|)
        let distance = 0;
        voterScores.forEach((vs, i) => {
          const voterRank = i + 1;
          const groupRank = groupRanking[vs.entryId] || voterRank;
          distance += Math.abs(voterRank - groupRank);
        });

        if (bestPalateScore === null || distance < bestPalateScore) {
          bestPalateScore = distance;
          bestPalateMemberId = score.memberId;
          bestPalateName = score.member?.user?.name || score.member?.guestName || "Guest";
          bestPalateAvatarUrl = score.member?.user?.avatarUrl || null;
        }
      }
    }

    // =========================================================
    // 4. Distribute Hood Bucks pot
    // =========================================================
    const potSize = event.hoodBucksPotSize;
    const hoodBucksAwards: { place: string; memberId: string; memberName: string; amount: number }[] = [];

    if (potSize > 0) {
      const places = [
        { idx: 0, label: "1st Place", split: TASTING_POT_SPLIT.FIRST },
        { idx: 1, label: "2nd Place", split: TASTING_POT_SPLIT.SECOND },
        { idx: 2, label: "3rd Place", split: TASTING_POT_SPLIT.THIRD },
      ];

      for (const p of places) {
        const entry = scoredEntries[p.idx];
        if (entry?.submittedByMemberId) {
          const amount = Math.floor(potSize * p.split);
          if (amount > 0) {
            const memberName = entry.submittedBy?.user?.name || entry.submittedBy?.guestName || "Guest";
            await awardTastingPot(
              entry.submittedByMemberId,
              tripId,
              amount,
              `Tasting ${p.label} - ${entry.wineName}`,
              entry.submittedBy?.user?.id
            );
            hoodBucksAwards.push({
              place: p.label,
              memberId: entry.submittedByMemberId,
              memberName,
              amount,
            });
          }
        }
      }

      // Best Palate award
      if (bestPalateMemberId) {
        const amount = Math.floor(potSize * TASTING_POT_SPLIT.BEST_PALATE);
        if (amount > 0) {
          const bpScore = event.scores.find((s) => s.memberId === bestPalateMemberId);
          await awardTastingPot(
            bestPalateMemberId,
            tripId,
            amount,
            "Best Palate Award",
            bpScore?.userId || undefined
          );
          hoodBucksAwards.push({
            place: "Best Palate",
            memberId: bestPalateMemberId,
            memberName: bestPalateName,
            amount,
          });
        }
      }
    }

    // =========================================================
    // 5. Resolve bets (unchanged logic)
    // =========================================================
    const bets = await prisma.wineBet.findMany({ where: { wineEventId: eventId } });
    const first = scoredEntries[0]?.id;
    const second = scoredEntries[1]?.id;
    const third = scoredEntries[2]?.id;

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

    // =========================================================
    // 6. Save all updates in a transaction
    // =========================================================
    const entryUpdates = [];
    for (let i = 0; i < scoredEntries.length; i++) {
      const place = i < 3 ? i + 1 : null;
      entryUpdates.push(
        prisma.wineEntry.update({
          where: { id: scoredEntries[i].id },
          data: {
            isRevealed: true,
            finalPlace: place,
            avgScore: scoredEntries[i].avgScore,
            totalVoters: scoredEntries[i].totalVoters,
          },
        })
      );
    }

    // Also reveal entries without bag numbers
    for (const e of event.entries.filter((e) => e.bagNumber === null)) {
      entryUpdates.push(
        prisma.wineEntry.update({
          where: { id: e.id },
          data: { isRevealed: true },
        })
      );
    }

    // Update event status + best palate
    entryUpdates.push(
      prisma.wineEvent.update({
        where: { id: eventId },
        data: {
          status: "REVEAL",
          revealedAt: new Date(),
          bestPalateMemberId,
          bestPalateScore,
        },
      })
    );

    await prisma.$transaction([...entryUpdates, ...betUpdates]);

    // =========================================================
    // 7. Build enhanced results
    // =========================================================
    const buildPlaceResult = (idx: number) => {
      const entry = scoredEntries[idx];
      if (!entry) return null;
      return {
        entryId: entry.id,
        bagNumber: entry.bagNumber,
        wineName: entry.wineName,
        winery: entry.winery,
        avgScore: entry.avgScore,
        totalVoters: entry.totalVoters,
        submittedBy: entry.submittedBy,
      };
    };

    const results = {
      winner: buildPlaceResult(0),
      second: buildPlaceResult(1),
      third: buildPlaceResult(2),
      totalScores: event.scores.length,
      totalEntries: scoredEntries.length,
      bestPalate: bestPalateMemberId
        ? {
            memberId: bestPalateMemberId,
            memberName: bestPalateName,
            avatarUrl: bestPalateAvatarUrl,
            spearmanDistance: bestPalateScore ?? 0,
          }
        : null,
      hoodBucksAwards,
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
