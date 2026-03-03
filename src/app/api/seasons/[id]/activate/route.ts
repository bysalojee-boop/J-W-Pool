import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { password } = await req.json();

        if (password !== "000") {
            return NextResponse.json({ error: "Invalid password" }, { status: 403 });
        }

        // Deactivate all seasons
        await prisma.season.updateMany({ data: { isActive: false } });

        // Activate the selected season
        const season = await prisma.season.update({
            where: { id },
            data: { isActive: true },
        });

        return NextResponse.json(season);
    } catch (e: any) {
        console.error("Error activating season:", e);
        return NextResponse.json({ error: "Failed to activate season", details: e?.message }, { status: 500 });
    }
}
