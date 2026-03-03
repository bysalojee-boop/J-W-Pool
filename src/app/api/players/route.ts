import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const players = await prisma.player.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, age, imageUrl } = body;

        if (!name || age === undefined || age === null) {
            return NextResponse.json({ error: "Name and age required" }, { status: 400 });
        }

        const player = await prisma.player.create({
            data: {
                name: name.trim(),
                age: parseInt(String(age), 10),
                imageUrl: imageUrl || null,
            },
        });

        return NextResponse.json(player, { status: 201 });
    } catch (e: any) {
        console.error("Error creating player:", e);
        return NextResponse.json({ error: "Failed to create player", details: e?.message }, { status: 500 });
    }
}
