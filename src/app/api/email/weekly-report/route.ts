import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const RECIPIENT = "salojee@jaws.co.za";

function buildCSV(games: any[]): string {
    const rows = [
        ["gameId", "date", "season", "player1", "player2", "result", "session", "comment"],
        ...games.map((g) => [
            g.id,
            g.playedAt.toISOString().split("T")[0],
            g.season?.name ?? "Season 1",
            g.player1.name,
            g.player2.name,
            g.player1Result,
            g.session,
            g.comment ?? "",
        ]),
    ];
    return rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
}

export async function POST(req: NextRequest) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Simple secret check so only cron can call this
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const games = await prisma.game.findMany({
            include: { player1: true, player2: true, season: true },
            orderBy: { playedAt: "asc" },
        });

        if (games.length === 0) {
            return NextResponse.json({ message: "No games to export — email not sent." });
        }

        const csv = buildCSV(games);
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `pool-history-${dateStr}.csv`;

        // Get leaderboard summary for email body
        const playerStats: Record<string, { name: string; wins: number; losses: number }> = {};
        for (const g of games) {
            if (!playerStats[g.player1Id]) playerStats[g.player1Id] = { name: g.player1.name, wins: 0, losses: 0 };
            if (!playerStats[g.player2Id]) playerStats[g.player2Id] = { name: g.player2.name, wins: 0, losses: 0 };
            if (g.player1Result === "WIN") {
                playerStats[g.player1Id].wins++;
                playerStats[g.player2Id].losses++;
            } else {
                playerStats[g.player2Id].wins++;
                playerStats[g.player1Id].losses++;
            }
        }

        const leaderboard = Object.values(playerStats)
            .sort((a, b) => b.wins - a.wins)
            .map((p, i) => {
                const total = p.wins + p.losses;
                const pct = total > 0 ? ((p.wins / total) * 100).toFixed(0) : "0";
                return `${i + 1}. ${p.name} — ${p.wins}W / ${p.losses}L (${pct}%)`;
            })
            .join("\n");

        const { error } = await resend.emails.send({
            from: "Pool Tracker <onboarding@resend.dev>",
            to: [RECIPIENT],
            subject: `🎱 Weekly Pool Report – ${dateStr}`,
            text: `Hi there,\n\nHere's your weekly pool league report for ${dateStr}.\n\nTotal Games Played: ${games.length}\n\n📊 Current Standings:\n${leaderboard}\n\nThe full game history CSV is attached for your records. You can re-import it at any time via Settings → Import Game History.\n\nPool Tracker 🎱`,
            attachments: [
                {
                    filename,
                    content: Buffer.from(csv).toString("base64"),
                },
            ],
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: "Email failed", details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, gamesExported: games.length, sentTo: RECIPIENT });
    } catch (e: any) {
        console.error("Weekly email error:", e);
        return NextResponse.json({ error: "Weekly email failed", details: e?.message }, { status: 500 });
    }
}
