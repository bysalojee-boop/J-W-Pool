import { prisma } from "@/lib/prisma";

export async function getCurrentSeason() {
    let season = await prisma.season.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });

    if (!season) {
        season = await prisma.season.create({
            data: { name: "Season 1" },
        });
    }

    return season;
}
