import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { player1Id, player2Id, player1Result, session, playedAt, comment } = body;

    try {
        const game = await prisma.game.update({
            where: { id },
            data: {
                player1Id,
                player2Id,
                player1Result,
                session,
                playedAt: playedAt ? new Date(playedAt) : undefined,
                comment
            }
        });
        return NextResponse.json(game);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.game.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
    }
}
