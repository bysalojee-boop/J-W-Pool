"use client";

import { useEffect, useState } from "react";

interface Player {
    id: string;
    name: string;
    imageUrl?: string | null;
}

interface Season {
    id: string;
    name: string;
}

interface Trend {
    gameNum: number;
    result: string;
    points: number;
    createdAt: string;
}

export default function StatsDashboard() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    const [seasonId, setSeasonId] = useState("all");
    const [compareSeasonId, setCompareSeasonId] = useState("all");

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/players").then(r => r.json()).then(setPlayers);
        fetch("/api/seasons").then(r => r.json()).then(setSeasons);
    }, []);

    useEffect(() => {
        if (!p1) {
            setData(null);
            return;
        }
        setLoading(true);
        const params = new URLSearchParams({
            p1,
            p2,
            seasonId,
            compareSeasonId
        });
        fetch(`/api/stats?${params.toString()}`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                setLoading(false);
            });
    }, [p1, p2, seasonId, compareSeasonId]);

    const getTrendColor = (res: string) => {
        if (res === "WIN") return "var(--accent-green)";
        if (res === "DRAW") return "var(--accent-yellow)";
        return "var(--accent-red)";
    };

    return (
        <main>
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Advanced Stats</h1>
                    <p className="page-subtitle">Deep dive into player and matchup performance</p>
                </div>

                <div className="stats-filters mb-24 animate-in">
                    <div className="stats-filters-grid">
                        <div className="form-group">
                            <label className="form-label">Main Player</label>
                            <select className="form-select" value={p1} onChange={e => setP1(e.target.value)}>
                                <option value="">Select player...</option>
                                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Opponent (H2H)</label>
                            <select className="form-select" value={p2} onChange={e => setP2(e.target.value)}>
                                <option value="">All Opponents</option>
                                {players.filter(p => p.id !== p1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Season Filter</label>
                            <select className="form-select" value={seasonId} onChange={e => setSeasonId(e.target.value)}>
                                <option value="all">All Seasons</option>
                                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Compare With</label>
                            <select className="form-select" value={compareSeasonId} onChange={e => setCompareSeasonId(e.target.value)}>
                                <option value="all">No Comparison</option>
                                {seasons.filter(s => s.id !== seasonId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : !p1 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">📊</span>
                        Select a player to see their performance stats and trends.
                    </div>
                ) : data && (
                    <div className="animate-in">
                        {/* Summary Cards */}
                        <div className="stats-grid mb-24">
                            <div className="stat-box">
                                <div className="stat-box-value" style={{ color: "var(--accent-green)" }}>{data.summary.wins}</div>
                                <div className="stat-box-label">Wins</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-value" style={{ color: "var(--accent-red)" }}>{data.summary.losses}</div>
                                <div className="stat-box-label">Losses</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-value" style={{ color: "var(--accent-yellow)" }}>{data.summary.goldenBreaks}</div>
                                <div className="stat-box-label">Golden Breaks</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-value">{data.games}</div>
                                <div className="stat-box-label">Total Selected</div>
                            </div>
                        </div>

                        {/* Trend Visualization */}
                        <div className="card mb-24">
                            <div className="section-title">Performance Trend (Last {data.trends.length} Games)</div>
                            <div className="trend-container" style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, padding: "10px 0" }}>
                                {data.trends.length === 0 ? (
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", width: "100%", textAlign: "center" }}>No game data for this selection.</div>
                                ) : data.trends.map((t: any) => (
                                    <div
                                        key={t.gameNum}
                                        style={{
                                            flex: 1,
                                            background: t.result === "GOLDEN" ? "var(--accent-yellow)" : t.result === "WIN" ? "var(--accent-green)" : "var(--accent-red)",
                                            height: t.result === "GOLDEN" ? "40%" : t.result === "WIN" ? "100%" : "20%",
                                            borderRadius: "4px 4px 0 0",
                                            minWidth: 12,
                                            position: "relative"
                                        }}
                                        title={`${t.result} vs ${t.opponent} (${new Date(t.createdAt).toLocaleDateString()})`}
                                    />
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                <span>Older</span>
                                <span>Recent (Hover bars for Opponent)</span>
                            </div>
                        </div>

                        {/* Comparison */}
                        {data.comparison && (
                            <div className="card">
                                <div className="section-title">Season Comparison</div>
                                <div className="flex gap-24" style={{ flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: 200, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 12 }}>Selected Season</div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)" }}>W: {data.summary.wins}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>GP: {data.games}</div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 200, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 12 }}>Comparison Season</div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 700, opacity: 0.7 }}>W: {data.comparison.wins}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>GP: {data.comparison.total}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    {data.summary.wins > data.comparison.wins ? "🚀 Improving performance compared to the other season!" : "Keep practicing to beat your past records!"}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ height: 48 }} />
            </div>

            <style jsx>{`
                .stats-filters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    padding: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                }
            `}</style>
        </main>
    );
}
