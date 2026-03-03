import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCSV(text: string): string[][] {
    const lines = text.trim().split(/\r?\n/);
    return lines.map((line) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
        }

        const headers = rows[0].map((h) => h.toLowerCase().replace(/"/g, ""));
        const dataRows = rows.slice(1);

        const getCol = (row: string[], name: string) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? row[idx]?.replace(/^"|"$/g, "") ?? "" : "";
        };

        // Cache of player name → id
        const playerCache: Record<string, string> = {};
        // Cache of season name → id
        const seasonCache: Record<string, string> = {};

        let imported = 0;
        let skipped = 0;

        for (const row of dataRows) {
            if (row.every((c) => !c)) continue;

            const date = getCol(row, "date");
            const seasonName = getCol(row, "season") || "Season 1";
            const p1Name = getCol(row, "player1");
            const p2Name = getCol(row, "player2");
            const result = getCol(row, "result").toUpperCase(); // WIN or LOSS
            const session = getCol(row, "session").toUpperCase();
            const comment = getCol(row, "comment");

            if (!p1Name || !p2Name || !result || !session) {
                skipped++;
                continue;
            }

            // Upsert player1
            if (!playerCache[p1Name]) {
                const existing = await prisma.player.findFirst({ where: { name: p1Name } });
                if (existing) {
                    playerCache[p1Name] = existing.id;
                } else {
                    const created = await prisma.player.create({ data: { name: p1Name, age: 0 } });
                    playerCache[p1Name] = created.id;
                }
            }

            // Upsert player2
            if (!playerCache[p2Name]) {
                const existing = await prisma.player.findFirst({ where: { name: p2Name } });
                if (existing) {
                    playerCache[p2Name] = existing.id;
                } else {
                    const created = await prisma.player.create({ data: { name: p2Name, age: 0 } });
                    playerCache[p2Name] = created.id;
                }
            }

            // Upsert season
            if (!seasonCache[seasonName]) {
                const existing = await prisma.season.findFirst({ where: { name: seasonName } });
                if (existing) {
                    seasonCache[seasonName] = existing.id;
                } else {
                    const created = await prisma.season.create({ data: { name: seasonName, isActive: false } });
                    seasonCache[seasonName] = created.id;
                }
            }

            const player1Id = playerCache[p1Name];
            const player2Id = playerCache[p2Name];
            const seasonId = seasonCache[seasonName];
            const playedAt = date ? new Date(date) : new Date();

            // Skip duplicate games (same players, same session, same date)
            const existing = await prisma.game.findFirst({
                where: {
                    player1Id,
                    player2Id,
                    session,
                    playedAt,
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            await prisma.game.create({
                data: {
                    player1Id,
                    player2Id,
                    player1Result: result === "WIN" ? "WIN" : "LOSS",
                    session,
                    seasonId,
                    playedAt,
                    comment: comment || null,
                },
            });
            imported++;
        }

        return NextResponse.json({ imported, skipped });
    } catch (e: any) {
        console.error("Import error:", e);
        return NextResponse.json({ error: "Import failed", details: e?.message }, { status: 500 });
    }
}
