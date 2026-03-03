"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlayerStats {
    player: { id: string; name: string; age: number; imageUrl?: string | null };
    wins: number;
    losses: number;
    totalGames: number;
    points: number;
    winPct: string;
    lossPct: string;
}

export default function HomePage() {
    const [data, setData] = useState<PlayerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [seasons, setSeasons] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

    useEffect(() => {
        // Fetch seasons first
        fetch("/api/seasons")
            .then((r) => r.json())
            .then((d) => {
                setSeasons(d);
                const active = d.find((s: any) => s.isActive);
                if (active) setSelectedSeasonId(active.id);
            });
    }, []);

    useEffect(() => {
        if (!selectedSeasonId) return;
        setLoading(true);
        fetch(`/api/leaderboard?seasonId=${selectedSeasonId}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, [selectedSeasonId]);

    const getInitial = (name: string) => name.charAt(0).toUpperCase();

    const getRankClass = (i: number) => {
        if (i === 0) return "rank rank-1";
        if (i === 1) return "rank rank-2";
        if (i === 2) return "rank rank-3";
        return "rank rank-other";
    };

    const getRankLabel = (i: number) => {
        if (i === 0) return "🥇";
        if (i === 1) return "🥈";
        if (i === 2) return "🥉";
        return String(i + 1);
    };

    return (
        <main>
            <div className="container">
                <div className="page-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-12" style={{ marginBottom: 4 }}>
                                <h1 className="page-title" style={{ margin: 0 }}>Leaderboard</h1>
                                {seasons.length > 0 && (
                                    <select
                                        value={selectedSeasonId}
                                        onChange={(e) => setSelectedSeasonId(e.target.value)}
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: 8,
                                            border: "1px solid var(--border-color)",
                                            background: "var(--card-bg)",
                                            color: "var(--text-color)",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            outline: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {seasons.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.isActive ? "(Current)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <p className="page-subtitle">Win = 3pts · Loss = 0pts</p>
                        </div>
                        <div className="flex gap-8">
                            <Link href="/players/new" className="btn btn-secondary">+ Add Player</Link>
                            <Link href="/" className="btn btn-primary">Log Game</Link>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state animate-in">
                        <div className="spinner" style={{ margin: "0 auto 12px" }} />
                        Loading...
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state animate-in">
                        <span className="empty-state-icon">🎱</span>
                        No games yet. <Link href="/players/new" style={{ color: "var(--accent-green)" }}>Add players</Link> and <Link href="/" style={{ color: "var(--accent-green)" }}>log a game</Link> to get started!
                    </div>
                ) : (
                    <div className="leaderboard animate-in">
                        <div className="lb-row lb-header">
                            <div>#</div>
                            <div>Player</div>
                            <div className="stat-cell">W</div>
                            <div className="stat-cell">L</div>
                            <div className="stat-cell">GP</div>
                            <div className="stat-cell">Win%</div>
                            <div className="stat-cell">Pts</div>
                        </div>
                        {data.map((row, i) => (
                            <Link key={row.player.id} href={`/players/${row.player.id}`} className="lb-row">
                                <span className={getRankClass(i)}>{getRankLabel(i)}</span>
                                <div className="player-info">
                                    <div className="avatar">
                                        {row.player.imageUrl ? (
                                            <img src={row.player.imageUrl} alt={row.player.name} />
                                        ) : (
                                            getInitial(row.player.name)
                                        )}
                                    </div>
                                    <div>
                                        <div className="player-name">{row.player.name}</div>
                                        <div className="player-age">Age {row.player.age}</div>
                                    </div>
                                </div>
                                <div className="stat-cell win">{row.wins}</div>
                                <div className="stat-cell loss">{row.losses}</div>
                                <div className="stat-cell">{row.totalGames}</div>
                                <div className="stat-cell pct">{row.winPct}%</div>
                                <div className="stat-cell points">{row.points}</div>
                            </Link>
                        ))}
                    </div>
                )}

                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}
