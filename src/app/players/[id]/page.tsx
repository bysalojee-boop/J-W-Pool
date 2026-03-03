"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PlayerData {
    player: { id: string; name: string; age: number; imageUrl?: string | null };
    stats: { wins: number; losses: number; totalGames: number; points: number; winPct: string };
    h2h: Array<{
        opponent: { id: string; name: string; imageUrl?: string | null };
        wins: number;
        losses: number;
        games: number;
    }>;
    recentGames: Array<{
        id: string;
        result: string;
        opponent: { id: string; name: string };
        session: string;
        createdAt: string;
    }>;
}

const SESSION_LABELS: Record<string, string> = {
    "10AM": "10:00 AM",
    LUNCH: "Lunch",
    "3PM": "3:00 PM",
};

export default function PlayerDetailPage() {
    const params = useParams();
    const [data, setData] = useState<PlayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/players/${params.id}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, [params.id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this player? This will soft-delete them from active leaderboards but keep their game history.")) return;

        setIsDeleting(true);
        const res = await fetch(`/api/players/${params.id}`, { method: "DELETE" });
        if (res.ok) {
            window.location.href = "/players";
        } else {
            alert("Failed to delete player");
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="empty-state animate-in"><div className="spinner" style={{ margin: "0 auto" }} /></div>;
    if (!data || !data.player) return <div className="empty-state">Player not found.</div>;

    const { player, stats, h2h, recentGames } = data;

    return (
        <main>
            <div className="container">
                <div className="page-header">
                    <Link href="/players" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>← Back to Players</Link>
                </div>

                {/* Profile Header */}
                <div className="profile-header animate-in">
                    <div className="profile-avatar">
                        {player.imageUrl ? (
                            <img src={player.imageUrl} alt={player.name} />
                        ) : (
                            player.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="profile-name">{player.name}</div>
                        <div className="profile-meta">Age {player.age}</div>
                        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-green)" }}>{stats.points}</span>
                            <span style={{ color: "var(--text-muted)", marginRight: 12, fontSize: "0.875rem" }}>points</span>

                            <Link href={`/players/${player.id}/edit`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                                ✏️ Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="btn btn-danger"
                                style={{ padding: "6px 12px", fontSize: "0.8rem", background: "rgba(255, 71, 87, 0.1)", color: "var(--accent-red)", border: "1px solid var(--accent-red)" }}
                            >
                                {isDeleting ? "Deleting..." : "🗑️ Remove"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid mb-24 animate-in">
                    <div className="stat-box">
                        <div className="stat-box-value" style={{ color: "var(--accent-green)" }}>{stats.wins}</div>
                        <div className="stat-box-label">Wins</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-value" style={{ color: "var(--accent-red)" }}>{stats.losses}</div>
                        <div className="stat-box-label">Losses</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-value">{stats.totalGames}</div>
                        <div className="stat-box-label">Games Played</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-value" style={{ color: "var(--accent-blue)" }}>{stats.winPct}%</div>
                        <div className="stat-box-label">Win Rate</div>
                    </div>
                </div>

                {/* H2H */}
                <div className="card mb-24 animate-in">
                    <div className="section-title">Head-to-Head Records</div>
                    {h2h.length === 0 ? (
                        <div className="empty-state" style={{ padding: "24px 0" }}>No games played yet.</div>
                    ) : (
                        <div className="h2h-list">
                            <div className="h2h-row" style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                                <div>Opponent</div>
                                <div className="stat-cell">W</div>
                                <div className="stat-cell">L</div>
                                <div className="stat-cell">GP</div>
                            </div>
                            {h2h.filter(h => h.games > 0).map((h) => (
                                <Link key={h.opponent.id} href={`/players/${h.opponent.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <div className="h2h-row" style={{ cursor: "pointer", transition: "background 0.2s", borderRadius: 12 }}>
                                        <div className="player-info">
                                            <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.875rem" }}>
                                                {h.opponent.imageUrl ? <img src={h.opponent.imageUrl} alt={h.opponent.name} /> : h.opponent.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{h.opponent.name}</span>
                                        </div>
                                        <div className="stat-cell win">{h.wins}</div>
                                        <div className="stat-cell loss">{h.losses}</div>
                                        <div className="stat-cell">{h.games}<span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>/5</span></div>
                                    </div>
                                </Link>
                            ))}
                            {h2h.filter(h => h.games === 0).length === h2h.length && (
                                <div className="empty-state" style={{ padding: "16px 0" }}>No H2H games played yet.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Games */}
                <div className="card animate-in">
                    <div className="section-title">Recent Games</div>
                    {recentGames.length === 0 ? (
                        <div className="empty-state" style={{ padding: "24px 0" }}>No games yet.</div>
                    ) : (
                        recentGames.slice(0, 15).map((g) => (
                            <div key={g.id} className="game-row">
                                <div className="player-info">
                                    <span className={`badge badge-${g.result.toLowerCase()}`}>{g.result}</span>
                                    <span style={{ fontWeight: 600 }}>vs {g.opponent.name}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{SESSION_LABELS[g.session] ?? g.session}</div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                        {new Date(g.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}
