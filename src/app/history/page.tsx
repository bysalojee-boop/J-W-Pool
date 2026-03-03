"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Season {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

interface LeaderboardEntry {
    player: { id: string; name: string; imageUrl?: string | null };
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    points: number;
    winPct: string;
}

export default function HistoryPage() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingLeaderboard, setFetchingLeaderboard] = useState(false);

    useEffect(() => {
        fetch("/api/seasons")
            .then((r) => r.json())
            .then((d) => {
                setSeasons(d);
                if (d.length > 0) {
                    setSelectedSeasonId(d[0].id);
                }
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!selectedSeasonId) return;
        setFetchingLeaderboard(true);
        fetch(`/api/leaderboard?seasonId=${selectedSeasonId}`)
            .then((r) => r.json())
            .then((d) => {
                setLeaderboard(Array.isArray(d) ? d : []);
                setFetchingLeaderboard(false);
            });
    }, [selectedSeasonId]);

    if (loading) return <div className="empty-state animate-in"><div className="spinner" style={{ margin: "0 auto" }} /></div>;

    return (
        <main>
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">League History</h1>
                    <p className="page-subtitle">View past seasons and historic results</p>
                </div>

                <div className="card mb-24 animate-in">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Select Season</label>
                        <select
                            className="form-input"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                            value={selectedSeasonId}
                            onChange={(e) => setSelectedSeasonId(e.target.value)}
                        >
                            {seasons.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.isActive ? "(Current)" : ""} — {new Date(s.createdAt).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {fetchingLeaderboard ? (
                    <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
                ) : (
                    <div className="card animate-in">
                        <div className="section-title">Final Standings</div>
                        {leaderboard.length === 0 ? (
                            <div className="empty-state">No games recorded in this season.</div>
                        ) : (
                            <div className="leaderboard">
                                <div className="leaderboard-row header" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 8 }}>
                                    <div>Rank</div>
                                    <div>Player</div>
                                    <div className="stat-cell">P</div>
                                    <div className="stat-cell">W</div>
                                    <div className="stat-cell">D</div>
                                    <div className="stat-cell">L</div>
                                    <div className="stat-cell">GP</div>
                                </div>
                                {leaderboard.map((entry, index) => (
                                    <div key={entry.player.id} className="leaderboard-row" style={{ padding: "12px 16px" }}>
                                        <div className="rank">{index + 1}</div>
                                        <div className="player-info">
                                            <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                                                {entry.player.imageUrl ? <img src={entry.player.imageUrl} alt={entry.player.name} /> : entry.player.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{entry.player.name}</span>
                                        </div>
                                        <div className="stat-cell points">{entry.points}</div>
                                        <div className="stat-cell win">{entry.wins}</div>
                                        <div className="stat-cell draw">{entry.draws}</div>
                                        <div className="stat-cell loss">{entry.losses}</div>
                                        <div className="stat-cell">{entry.totalGames}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}
