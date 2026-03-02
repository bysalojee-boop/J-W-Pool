"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Player {
    id: string;
    name: string;
    age: number;
    imageUrl?: string | null;
}

export default function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/players")
            .then((r) => r.json())
            .then((d) => { setPlayers(d); setLoading(false); });
    }, []);

    return (
        <main>
            <div className="container">
                <div className="page-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="page-title">Players</h1>
                            <p className="page-subtitle">All registered pool players</p>
                        </div>
                        <Link href="/players/new" className="btn btn-primary">+ Add Player</Link>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state animate-in">
                        <div className="spinner" style={{ margin: "0 auto 12px" }} />
                        Loading...
                    </div>
                ) : players.length === 0 ? (
                    <div className="empty-state animate-in">
                        <span className="empty-state-icon">👤</span>
                        No players yet. Add the first one!
                    </div>
                ) : (
                    <div className="players-grid animate-in">
                        {players.map((p) => (
                            <div key={p.id} className="player-card" style={{ position: "relative" }}>
                                <Link href={`/players/${p.id}`} className="player-card-content" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "20px" }}>
                                    <div className="player-card-avatar">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} />
                                        ) : (
                                            p.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="player-name">{p.name}</div>
                                    <div className="player-age" style={{ textAlign: "center", marginTop: 2 }}>Age {p.age}</div>
                                </Link>

                                <PlayerMenu id={p.id} onDelete={() => setPlayers(prev => prev.filter(pl => pl.id !== p.id))} />
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}

function PlayerMenu({ id, onDelete }: { id: string, onDelete: () => void }) {
    const [open, setOpen] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to remove this player?")) return;

        const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
        if (res.ok) {
            onDelete();
        } else {
            alert("Failed to delete player");
        }
        setOpen(false);
    };

    return (
        <div className="player-actions-wrapper" style={{ position: "absolute", top: 12, right: 12 }}>
            <button
                className="btn-dots"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
                style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: "1.2rem", opacity: 0.6 }}
            >
                ⋮
            </button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
                    <div className="player-menu-dropdown animate-in" style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        zIndex: 11,
                        minWidth: 120,
                        overflow: "hidden"
                    }}>
                        <Link href={`/players/${id}/edit`} style={{ display: "block", padding: "8px 16px", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.85rem" }} onClick={(e) => e.stopPropagation()}>
                            ✏️ Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                border: "none",
                                background: "none",
                                color: "var(--accent-red)",
                                padding: "8px 16px",
                                cursor: "pointer",
                                fontSize: "0.85rem"
                            }}
                        >
                            🗑️ Remove
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
