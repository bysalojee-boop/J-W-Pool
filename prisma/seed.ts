import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up existing data...");
    await prisma.game.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.season.deleteMany({});

    console.log("Creating Trial Season...");
    const season = await prisma.season.create({
        data: { name: "Trial Season", isActive: true }
    });

    const playersData = [
        { name: "John Wick", age: 35 },
        { name: "Sarah Connor", age: 28 },
        { name: "Rick Sanchez", age: 70 },
        { name: "Ellen Ripley", age: 32 },
        { name: "Tony Stark", age: 45 },
        { name: "Daenerys Targaryen", age: 24 },
        { name: "Walter White", age: 52 },
        { name: "Lara Croft", age: 27 },
        { name: "Bruce Wayne", age: 40 },
        { name: "Sherlock Holmes", age: 38 }
    ];

    console.log("Creating 10 Players...");
    const players = await Promise.all(
        playersData.map(p => prisma.player.create({ data: p }))
    );

    console.log("Simulating 100 Random Games...");
    const sessions = ["10AM", "LUNCH", "3PM"];
    const results = ["WIN", "LOSS", "DRAW"];

    const h2hCounts: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        const p1 = players[Math.floor(Math.random() * players.length)];
        let p2 = players[Math.floor(Math.random() * players.length)];
        while (p1.id === p2.id) {
            p2 = players[Math.floor(Math.random() * players.length)];
        }

        const h2hKey = [p1.id, p2.id].sort().join("-");
        h2hCounts[h2hKey] = (h2hCounts[h2hKey] || 0) + 1;

        if (h2hCounts[h2hKey] > 5) continue; // Respect the 5-game limit

        const result = results[Math.floor(Math.random() * results.length)];
        const session = sessions[Math.floor(Math.random() * sessions.length)];

        await prisma.game.create({
            data: {
                player1Id: p1.id,
                player2Id: p2.id,
                player1Result: result,
                session,
                seasonId: season.id
            }
        });
    }

    console.log("Simulation complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
