import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        // Deactivate all current seasons
        await prisma.season.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });

        // Get total season count for naming
        const count = await prisma.season.count();

        // Create new active season
        const season = await prisma.season.create({
            data: {
                name: `Season ${count + 1}`,
                isActive: true,
            },
        });

        return NextResponse.json(season);
    } catch (e: any) {
        console.error("Error resetting league:", e);
        return NextResponse.json({ error: "Failed to reset league", details: e?.message }, { status: 500 });
    }
}
