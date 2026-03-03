import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const seasons = await prisma.season.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(seasons);
    } catch (e: any) {
        console.error("Error fetching seasons:", e);
        return NextResponse.json({ error: "Failed to fetch seasons", details: e?.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, password } = await req.json();
        if (password !== "000") return NextResponse.json({ error: "Invalid password" }, { status: 403 });

        const season = await prisma.season.create({
            data: { name, isActive: false },
        });
        return NextResponse.json(season);
    } catch (e: any) {
        console.error("Error creating season:", e);
        return NextResponse.json({ error: "Failed to create season", details: e?.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const password = searchParams.get("password");

        if (password !== "000") return NextResponse.json({ error: "Invalid password" }, { status: 403 });
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Delete games in this season first (cascading equivalent)
        await prisma.game.deleteMany({ where: { seasonId: id } });

        await prisma.season.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete season" }, { status: 500 });
    }
}
