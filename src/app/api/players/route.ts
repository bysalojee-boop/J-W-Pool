import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function GET() {
    const players = await prisma.player.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const ageStr = formData.get("age") as string;
    const image = formData.get("image") as File | null;

    if (!name || !ageStr) {
        return NextResponse.json({ error: "Name and age required" }, { status: 400 });
    }

    const age = parseInt(ageStr, 10);
    let imageUrl: string | undefined;

    if (image && image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        const filename = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;
        await writeFile(join(uploadDir, filename), buffer);
        imageUrl = `/uploads/${filename}`;
    }

    const player = await prisma.player.create({
        data: { name, age, imageUrl },
    });

    return NextResponse.json(player, { status: 201 });
}
