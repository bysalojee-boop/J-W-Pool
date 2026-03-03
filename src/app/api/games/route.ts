import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSeason } from "@/lib/seasons";

const MAX_H2H_GAMES = 5;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    const where: any = {};
    if (seasonId && seasonId !== "all") {
        where.seasonId = seasonId;
    } else if (!seasonId) {
        const season = await getCurrentSeason();
        where.seasonId = season.id;
    }

    const games = await prisma.game.findMany({
        where,
        include: { player1: true, player2: true },
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { player1Id, player2Id, player1Result, session, playedAt, comment } = body;

    if (!player1Id || !player2Id || !player1Result || !session) {
        return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (player1Id === player2Id) {
        return NextResponse.json({ error: "Players must be different" }, { status: 400 });
    }

    const validResults = ["WIN", "LOSS"];
    const validSessions = ["10AM", "LUNCH", "3PM"];
    if (!validResults.includes(player1Result) || !validSessions.includes(session)) {
        return NextResponse.json({ error: "Invalid result or session" }, { status: 400 });
    }

    // Check H2H game limit (order-independent)
    const existingGames = await prisma.game.count({
        where: {
            OR: [
                { player1Id, player2Id },
                { player1Id: player2Id, player2Id: player1Id },
            ],
        },
    });

    if (existingGames >= MAX_H2H_GAMES) {
        return NextResponse.json(
            { error: `These two players have already played ${MAX_H2H_GAMES} games against each other. They must verse other opponents.` },
            { status: 400 }
        );
    }

    const season = await getCurrentSeason();

    const game = await prisma.game.create({
        data: {
            player1Id,
            player2Id,
            player1Result,
            session,
            seasonId: season.id,
            playedAt: playedAt ? new Date(playedAt) : new Date(),
            comment
        },
        include: { player1: true, player2: true },
    });

    return NextResponse.json(game, { status: 201 });
}
