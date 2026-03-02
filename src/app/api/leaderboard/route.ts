import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSeason } from "@/lib/seasons";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    let season;
    if (seasonId) {
        season = await prisma.season.findUnique({ where: { id: seasonId } });
    } else {
        season = await getCurrentSeason();
    }

    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    const players = await prisma.player.findMany({ where: { deletedAt: null } });
    const games = await prisma.game.findMany({
        where: {
            seasonId: season.id,
            NOT: { comment: "golden break" }
        }
    });

    const stats = players.map((player) => {
        let wins = 0, losses = 0;

        for (const g of games) {
            if (g.player1Id === player.id) {
                if (g.player1Result === "WIN") wins++;
                else if (g.player1Result === "LOSS") losses++;
            } else if (g.player2Id === player.id) {
                if (g.player1Result === "LOSS") wins++;
                else if (g.player1Result === "WIN") losses++;
            }
        }

        const totalGames = wins + losses;
        const points = wins * 3;
        const winPct = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : "0.0";
        const lossPct = totalGames > 0 ? ((losses / totalGames) * 100).toFixed(1) : "0.0";

        return {
            player,
            wins,
            losses,
            totalGames,
            points,
            winPct,
            lossPct,
        };
    });

    // Sort by points desc, then wins desc
    stats.sort((a, b) => {
        if (b.points !== a.points) return Number(b.points) - Number(a.points);
        return b.wins - a.wins;
    });

    return NextResponse.json(stats);
}
