"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface Player {
    id: string;
    name: string;
    age: number;
    imageUrl?: string | null;
}

const SESSIONS = [
    { value: "10AM", label: "🌅 10:00 AM" },
    { value: "LUNCH", label: "☀️ Lunch" },
    { value: "3PM", label: "🌇 3:00 PM" },
];

const RESULTS = [
    { value: "WIN", label: "Win", className: "badge-win" },
    { value: "DRAW", label: "Draw", className: "badge-draw" },
    { value: "LOSS", label: "Loss", className: "badge-loss" },
];

function LogGameForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [players, setPlayers] = useState<Player[]>([]);
    const [player1Id, setPlayer1Id] = useState(searchParams.get("player1") ?? "");
    const [player2Id, setPlayer2Id] = useState(searchParams.get("player2") ?? "");
    const [winnerId, setWinnerId] = useState("");
    const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);
    const [comment, setComment] = useState("");
    const [session, setSession] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [h2hCount, setH2hCount] = useState<number | null>(null);

    const COMMENTS = [
        "Bank shot",
        "dropped black and white",
        "time ran out",
        "White wash",
        "golden break"
    ];

    useEffect(() => {
        fetch("/api/players")
            .then((r) => r.json())
            .then(setPlayers);
    }, []);

    // Check H2H count whenever players change
    useEffect(() => {
        if (!player1Id || !player2Id || player1Id === player2Id) {
            setH2hCount(null);
            return;
        }
        fetch("/api/games")
            .then((r) => r.json())
            .then((games: Array<{ player1Id: string; player2Id: string }>) => {
                const count = games.filter(
                    (g) =>
                        (g.player1Id === player1Id && g.player2Id === player2Id) ||
                        (g.player1Id === player2Id && g.player2Id === player1Id)
                ).length;
                setH2hCount(count);
            });
    }, [player1Id, player2Id]);

    const randomize = useCallback(() => {
        if (players.length < 2) return;
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        setPlayer1Id(shuffled[0].id);
        setPlayer2Id(shuffled[1].id);
        setWinnerId("");
    }, [players]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!player1Id || !player2Id || !winnerId || !session) {
            setError("All fields are required.");
            return;
        }
        if (player1Id === player2Id) {
            setError("Players must be different.");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");

        // player1Result mapping: if winnerId === player1Id, then "WIN", else "LOSS"
        const player1Result = winnerId === player1Id ? "WIN" : "LOSS";

        const res = await fetch("/api/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                player1Id,
                player2Id,
                player1Result,
                session,
                playedAt: new Date(playedAt).toISOString(),
                comment
            }),
        });

        const data = await res.json();
        if (res.ok) {
            setSuccess("Game logged successfully! 🎱");
            setWinnerId("");
            setComment("");
            router.push("/leaderboard");
        } else {
            setError(data.error || "Failed to log game.");
        }
        setLoading(false);
    };

    const getPlayer = (id: string) => players.find((p) => p.id === id);
    const p1 = getPlayer(player1Id);
    const p2 = getPlayer(player2Id);

    return (
        <main>
            <div className="container" style={{ maxWidth: 600 }}>
                <div className="page-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="page-title">Log a Game</h1>
                            <p className="page-subtitle">Record the result of a pool match</p>
                        </div>
                    </div>
                </div>

                {/* Random Matcher */}
                {players.length >= 2 && (
                    <div className="match-generator animate-in">
                        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                            🎲 Random Match Generator
                        </div>
                        {p1 && p2 ? (
                            <div className="match-vs">
                                <div className="match-player">
                                    <div className="avatar" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>
                                        {p1.imageUrl ? <img src={p1.imageUrl} alt={p1.name} /> : p1.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p1.name}</span>
                                </div>
                                <span className="match-vs-label">VS</span>
                                <div className="match-player">
                                    <div className="avatar" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>
                                        {p2.imageUrl ? <img src={p2.imageUrl} alt={p2.name} /> : p2.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p2.name}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: "var(--text-muted)", padding: "12px 0" }}>Click to generate a random match</div>
                        )}
                        <button className="btn btn-secondary mt-8" type="button" onClick={randomize}>
                            🔀 Randomize Match
                        </button>
                    </div>
                )}

                <div className="card animate-in">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {h2hCount !== null && h2hCount >= 5 && (
                        <div className="alert alert-error">
                            ⚠️ These players have already played 5 games against each other and cannot play again.
                        </div>
                    )}

                    {h2hCount !== null && h2hCount > 0 && h2hCount < 5 && (
                        <div style={{ padding: "10px 14px", background: "var(--accent-blue-dim)", border: "1px solid rgba(68,138,255,0.2)", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", color: "var(--accent-blue)" }}>
                            These players have played <strong>{h2hCount}/5</strong> games against each other.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="p1">Player 1 (Select Your Name)</label>
                            <select id="p1" className="form-select" value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)} required>
                                <option value="">Select player...</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id} disabled={p.id === player2Id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="p2">Player 2 (Who You Versed)</label>
                            <select id="p2" className="form-select" value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)} required>
                                <option value="">Select player...</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id} disabled={p.id === player1Id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="playedAt">Date of Game</label>
                            <input
                                type="date"
                                id="playedAt"
                                className="form-input"
                                value={playedAt}
                                onChange={(e) => setPlayedAt(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Session</label>
                            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
                                {SESSIONS.map((s) => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        className={`btn ${session === s.value ? "btn-primary" : "btn-secondary"}`}
                                        style={{ flex: 1, minWidth: 120 }}
                                        onClick={() => setSession(s.value)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="winner">Winner</label>
                            <select id="winner" className="form-select" value={winnerId} onChange={(e) => setWinnerId(e.target.value)} required>
                                <option value="">Select winner...</option>
                                {p1 && <option value={p1.id}>{p1.name}</option>}
                                {p2 && <option value={p2.id}>{p2.name}</option>}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="comment">Comment (Optional)</label>
                            <select id="comment" className="form-select" value={comment} onChange={(e) => setComment(e.target.value)}>
                                <option value="">No comment</option>
                                {COMMENTS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-8"
                            disabled={loading || (h2hCount !== null && h2hCount >= 5)}
                        >
                            {loading ? <span className="spinner" /> : "Log Game 🎱"}
                        </button>

                    </form>
                </div>
                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}

export default function LogGamePage() {
    return (
        <Suspense fallback={<div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>}>
            <LogGameForm />
        </Suspense>
    );
}
