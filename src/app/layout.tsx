import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Pool Tracker",
    description: "Track pool game wins, losses, and player stats",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <nav className="nav">
                    <div className="nav-inner">
                        <Link href="/" className="nav-brand">
                            🎱 Pool Tracker
                        </Link>
                        <ul className="nav-links">
                            <li><Link href="/">Log Game</Link></li>
                            <li><Link href="/leaderboard">Leaderboard</Link></li>
                            <li><Link href="/players">Players</Link></li>
                            <li><Link href="/stats">Stats</Link></li>
                            <li><Link href="/history">Seasons</Link></li>
                            <li><Link href="/history/games">Manage Games</Link></li>
                            <li><Link href="/settings" className="settings-link" title="Settings">⚙️</Link></li>
                        </ul>
                    </div>
                </nav>
                {children}
            </body>
        </html>
    );
}
