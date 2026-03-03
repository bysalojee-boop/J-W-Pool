import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // All games involving this player
    const gamesAsP1 = await prisma.game.findMany({
        where: { player1Id: id },
        include: { player2: true },
        orderBy: { createdAt: "desc" },
    });
    const gamesAsP2 = await prisma.game.findMany({
        where: { player2Id: id },
        include: { player1: true },
        orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    let wins = 0, losses = 0;
    for (const g of gamesAsP1) {
        if (g.player1Result === "WIN") wins++;
        else if (g.player1Result === "LOSS") losses++;
    }
    for (const g of gamesAsP2) {
        if (g.player1Result === "LOSS") wins++;
        else if (g.player1Result === "WIN") losses++;
    }

    const totalGames = wins + losses;
    const points = wins * 3;
    const winPct = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : "0.0";

    // H2H breakdown
    const allOpponents = await prisma.player.findMany({ where: { id: { not: id } } });
    const h2h: Record<string, { opponent: { id: string; name: string; imageUrl?: string | null }; wins: number; losses: number; games: number }> = {};
    for (const opp of allOpponents) {
        h2h[opp.id] = { opponent: opp, wins: 0, losses: 0, games: 0 };
    }
    for (const g of gamesAsP1) {
        const h = h2h[g.player2Id];
        if (!h) continue;
        h.games++;
        if (g.player1Result === "WIN") h.wins++;
        else if (g.player1Result === "LOSS") h.losses++;
    }
    for (const g of gamesAsP2) {
        const h = h2h[g.player1Id];
        if (!h) continue;
        h.games++;
        if (g.player1Result === "LOSS") h.wins++;
        else if (g.player1Result === "WIN") h.losses++;
    }

    // Recent games formatted
    const recentGames = [
        ...gamesAsP1.map((g) => ({
            id: g.id,
            result: g.player1Result,
            opponent: g.player2,
            session: g.session,
            createdAt: g.playedAt || g.createdAt,
        })),
        ...gamesAsP2.map((g) => ({
            id: g.id,
            result: g.player1Result === "WIN" ? "LOSS" : "WIN",
            opponent: g.player1,
            session: g.session,
            createdAt: g.playedAt || g.createdAt,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
        player,
        stats: { wins, losses, totalGames, points, winPct },
        h2h: Object.values(h2h),
        recentGames,
    });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const body = await req.json();
        const { name, age, imageUrl } = body;

        const data: any = {};
        if (name) data.name = name.trim();
        if (age !== undefined && age !== null) data.age = parseInt(String(age), 10);
        if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

        const player = await prisma.player.update({
            where: { id },
            data,
        });
        return NextResponse.json(player);
    } catch (e: any) {
        console.error("Error updating player:", e);
        return NextResponse.json({ error: "Failed to update player", details: e?.message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.player.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error deleting player:", e);
        return NextResponse.json({ error: "Failed to delete player", details: e?.message }, { status: 500 });
    }
}
