import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const p1Id = searchParams.get("p1");
    const p2Id = searchParams.get("p2");
    const seasonId = searchParams.get("seasonId");
    const compareSeasonId = searchParams.get("compareSeasonId");

    try {
        // Basic stats for a player or matchup
        const query: any = {
            where: {}
        };

        if (seasonId && seasonId !== "all") {
            query.where.seasonId = seasonId;
        }

        if (p1Id && p2Id) {
            // H2H Matchup
            query.where.OR = [
                { player1Id: p1Id, player2Id: p2Id },
                { player1Id: p2Id, player2Id: p1Id }
            ];
        } else if (p1Id) {
            // Single Player
            query.where.OR = [
                { player1Id: p1Id },
                { player2Id: p1Id }
            ];
        }

        const games = await prisma.game.findMany({
            where: query.where,
            include: { player1: true, player2: true },
            orderBy: { playedAt: "asc" }
        }) as any[];

        // Calculate trends (aggregate by game sequence)
        const trends = games.map((g, index) => {
            const isP1 = g.player1Id === p1Id;
            const opponent = isP1 ? g.player2.name : g.player1.name;
            const result = isP1 ? g.player1Result : (g.player1Result === "WIN" ? "LOSS" : "WIN");

            // If golden break, it's neither win nor loss for the stats summary
            const isGoldenBreak = g.comment === "golden break";

            return {
                gameNum: index + 1,
                result: isGoldenBreak ? "GOLDEN" : result,
                opponent,
                points: isGoldenBreak ? 0 : (result === "WIN" ? 3 : 0),
                createdAt: g.playedAt,
                comment: g.comment
            };
        });

        // If comparing seasons, get data for the other season too
        let comparison = null;
        if (p1Id && compareSeasonId && compareSeasonId !== "all") {
            const compGames = await prisma.game.findMany({
                where: {
                    seasonId: compareSeasonId,
                    OR: [
                        { player1Id: p1Id },
                        { player2Id: p1Id }
                    ],
                    NOT: { comment: "golden break" }
                }
            });

            let cWins = 0, cLosses = 0;
            compGames.forEach(g => {
                const isP1 = g.player1Id === p1Id;
                const res = isP1 ? g.player1Result : (g.player1Result === "WIN" ? "LOSS" : "WIN");
                if (res === "WIN") cWins++;
                else cLosses++;
            });
            comparison = { wins: cWins, losses: cLosses, total: compGames.length };
        }

        return NextResponse.json({
            games: games.length,
            trends,
            comparison,
            summary: {
                wins: trends.filter(t => t.result === "WIN").length,
                losses: trends.filter(t => t.result === "LOSS").length,
                goldenBreaks: trends.filter(t => t.comment === "golden break").length
            }
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
