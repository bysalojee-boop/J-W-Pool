import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const games = await prisma.game.findMany({
            include: {
                player1: true,
                player2: true,
                season: true,
            },
            orderBy: { playedAt: "asc" },
        });

        const rows = [
            ["gameId", "date", "season", "player1", "player2", "result", "session", "comment"],
            ...games.map((g) => [
                g.id,
                g.playedAt.toISOString().split("T")[0],
                g.season?.name ?? "Season 1",
                g.player1.name,
                g.player2.name,
                g.player1Result, // WIN or LOSS from player1's perspective
                g.session,
                g.comment ?? "",
            ]),
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="pool-history-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (e: any) {
        console.error("Export error:", e);
        return NextResponse.json({ error: "Export failed", details: e?.message }, { status: 500 });
    }
}
