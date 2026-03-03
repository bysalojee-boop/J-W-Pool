"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Game {
    id: string;
    playedAt: string;
    session: string;
    player1: { name: string; id: string };
    player2: { name: string; id: string };
    player1Result: string;
    comment: string | null;
}

export default function ManageGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const fetchGames = async () => {
        setLoading(true);
        const res = await fetch("/api/games?seasonId=all"); // Get all games for management
        const data = await res.json();
        setGames(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this game record?")) return;
        const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchGames();
        } else {
            alert("Failed to delete game.");
        }
    };

    return (
        <main>
            <div className="container" style={{ maxWidth: 1000 }}>
                <div className="page-header">
                    <h1 className="page-title">Manage Games</h1>
                    <p className="page-subtitle">View and edit historical match logs</p>
                </div>

                {loading ? (
                    <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
                ) : games.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">🎱</span>
                        No games logged yet.
                    </div>
                ) : (
                    <div className="card animate-in" style={{ padding: 0, overflowX: "auto" }}>
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Session</th>
                                    <th>Player 1</th>
                                    <th>Player 2</th>
                                    <th>Winner</th>
                                    <th>Comment</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {games.map((g, index) => {
                                    const winnerName = g.player1Result === "WIN" ? g.player1.name : g.player2.name;
                                    return (
                                        <tr key={g.id}>
                                            <td style={{ opacity: 0.5, fontSize: "0.8rem" }}>{games.length - index}</td>
                                            <td>{new Date(g.playedAt).toLocaleDateString()}</td>
                                            <td><span className="badge badge-draw">{g.session}</span></td>
                                            <td>{g.player1.name}</td>
                                            <td>{g.player2.name}</td>
                                            <td><span className="badge badge-win">{winnerName}</span></td>
                                            <td style={{ fontStyle: "italic", fontSize: "0.85rem", opacity: 0.8 }}>
                                                {g.comment === "golden break" ? <span style={{ color: "var(--accent-yellow)" }}>🌟 Golden Break</span> : g.comment || "-"}
                                            </td>
                                            <td style={{ position: "relative" }}>
                                                <button
                                                    className="player-menu-btn"
                                                    onClick={() => setMenuOpen(menuOpen === g.id ? null : g.id)}
                                                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 8 }}
                                                >
                                                    ⋮
                                                </button>
                                                {menuOpen === g.id && (
                                                    <div className="player-menu show" style={{ right: 30, top: 0, minWidth: 100 }}>
                                                        <button
                                                            className="player-menu-item"
                                                            onClick={() => alert("Edit functionality can be implemented by redirecting to a dedicated edit page or opening a modal.")}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            className="player-menu-item"
                                                            style={{ color: "var(--accent-red)" }}
                                                            onClick={() => handleDelete(g.id)}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ height: 48 }} />
            </div>

            <style jsx>{`
                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                .history-table th {
                    text-align: left;
                    padding: 16px;
                    border-bottom: 2px solid var(--border-color);
                    color: var(--text-secondary);
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .history-table td {
                    padding: 16px;
                    border-bottom: 1px solid var(--border-color);
                }
                .history-table tr:hover {
                    background: rgba(255,255,255,0.02);
                }
            `}</style>
        </main>
    );
}
