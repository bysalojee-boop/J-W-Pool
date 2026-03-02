"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Season {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Custom UI states
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSeasonName, setNewSeasonName] = useState("");
    const [seasonPassword, setSeasonPassword] = useState("");

    const [deleteIntent, setDeleteIntent] = useState<{ id: string, name: string } | null>(null);
    const [deletePassword, setDeletePassword] = useState("");

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        const res = await fetch("/api/seasons");
        const data = await res.json();
        setSeasons(data);
        setFetching(false);
    };

    const handleReset = async () => {
        setLoading(true);
        const res = await fetch("/api/seasons/reset", { method: "POST" });
        if (res.ok) {
            setShowResetConfirm(false);
            fetchSeasons();
            router.push("/leaderboard");
        } else {
            alert("Failed to reset league.");
            setLoading(false);
        }
    };

    const submitAddSeason = async () => {
        if (!newSeasonName) { alert("Please enter a season name."); return; }
        if (seasonPassword !== "000") { alert("Invalid password"); return; }

        setLoading(true);
        const res = await fetch("/api/seasons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newSeasonName, password: seasonPassword })
        });
        if (res.ok) {
            fetchSeasons();
            setShowAddForm(false);
            setNewSeasonName("");
            setSeasonPassword("");
        } else {
            alert("Failed to add season.");
        }
        setLoading(false);
    };

    const submitDeleteSeason = async () => {
        if (!deleteIntent) return;
        if (deletePassword !== "000") { alert("Invalid password"); return; }

        setLoading(true);
        const res = await fetch(`/api/seasons?id=${deleteIntent.id}&password=${deletePassword}`, { method: "DELETE" });
        if (res.ok) {
            fetchSeasons();
            setDeleteIntent(null);
            setDeletePassword("");
        } else {
            alert("Failed to delete season.");
        }
        setLoading(false);
    };

    return (
        <main>
            <div className="container" style={{ maxWidth: 640 }}>
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your pool tracker configuration</p>
                </div>

                <div className="card mb-24 animate-in">
                    <div style={{ padding: "8px 0" }}>
                        <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>Quick League Reset</div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>
                            Archive the current active season and start a new one automatically.
                        </p>

                        {!showResetConfirm ? (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? "Processing..." : "🏁 Reset Current League"}
                            </button>
                        ) : (
                            <div style={{ background: "rgba(255, 159, 67, 0.1)", padding: 16, borderRadius: 8, border: "1px solid var(--accent-yellow)" }}>
                                <div style={{ fontWeight: 600, color: "var(--accent-yellow)", marginBottom: 8 }}>⚠️ Are you absolutely sure?</div>
                                <p style={{ fontSize: "0.875rem", marginBottom: 16 }}>
                                    Resetting the league will close the current active season and archive all its standings and match history. A brand new, empty season will instantly begin. This action cannot be reversed!
                                </p>
                                <div className="flex gap-8">
                                    <button className="btn btn-primary" onClick={handleReset} style={{ flex: 1, background: "var(--accent-yellow)", color: "#000" }}>Confirm Reset</button>
                                    <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)} disabled={loading} style={{ flex: 1 }}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card mb-24 animate-in">
                    <div className="flex items-center justify-between mb-16">
                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>Season Management</div>
                        <button className="btn btn-secondary" onClick={() => setShowAddForm(!showAddForm)} disabled={loading} style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            {showAddForm ? "Cancel" : "+ Add Custom Season"}
                        </button>
                    </div>

                    {showAddForm && (
                        <div style={{ background: "var(--bg-color)", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-color)" }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: "0.875rem" }}>Season Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Season 2"
                                    value={newSeasonName}
                                    onChange={(e) => setNewSeasonName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: "0.875rem" }}>Management Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter 000"
                                    value={seasonPassword}
                                    onChange={(e) => setSeasonPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <button className="btn btn-primary" onClick={submitAddSeason} disabled={loading} style={{ width: "100%" }}>
                                Confirm & Add
                            </button>
                        </div>
                    )}

                    {deleteIntent && (
                        <div style={{ background: "rgba(255, 71, 87, 0.05)", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid var(--accent-red)" }}>
                            <div style={{ fontWeight: 600, color: "var(--accent-red)", marginBottom: 8 }}>Permanent Deletion of {deleteIntent.name}</div>
                            <p style={{ fontSize: "0.875rem", marginBottom: 16 }}>This will permanently delete ALL games within this season. This action cannot be undone.</p>
                            <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: "0.875rem" }}>Confirm Management Password</label>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter 000"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex gap-8">
                                <button className="btn btn-danger" onClick={submitDeleteSeason} disabled={loading} style={{ flex: 1 }}>Confirm Delete</button>
                                <button className="btn btn-secondary" onClick={() => { setDeleteIntent(null); setDeletePassword(""); }} disabled={loading} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {fetching ? (
                        <div className="spinner" style={{ margin: "20px auto" }} />
                    ) : seasons.length === 0 ? (
                        <div className="empty-state">No seasons found.</div>
                    ) : (
                        <div className="seasons-list">
                            {seasons.map(s => (
                                <div key={s.id} className="flex items-center justify-between" style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{s.name} {s.isActive && <span className="badge badge-win" style={{ fontSize: "0.6rem", padding: "2px 6px", marginLeft: 8 }}>Active</span>}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Started: {new Date(s.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => setDeleteIntent({ id: s.id, name: s.name })}
                                        disabled={loading || s.isActive}
                                        style={{
                                            padding: "4px 8px",
                                            fontSize: "0.7rem",
                                            opacity: (loading || s.isActive) ? 0.3 : 1,
                                            background: "rgba(255, 71, 87, 0.1)",
                                            color: "var(--accent-red)",
                                            border: "1px solid var(--accent-red)"
                                        }}
                                        title={s.isActive ? "Cannot delete the active season" : "Delete season"}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card animate-in" style={{ opacity: 0.6 }}>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>About Pool Tracker</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        Version 1.3.0 - Pro Stats Edition<br />
                        Management Password: Required for destructive actions.
                    </p>
                </div>
            </div>
        </main>
    );
}
