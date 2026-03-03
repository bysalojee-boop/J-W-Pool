"use client";

import { useState, useEffect, useRef } from "react";
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

    const [showAddForm, setShowAddForm] = useState(false);
    const [newSeasonName, setNewSeasonName] = useState("");
    const [seasonPassword, setSeasonPassword] = useState("");

    const [activateIntent, setActivateIntent] = useState<{ id: string; name: string } | null>(null);
    const [activatePassword, setActivatePassword] = useState("");

    const [deleteIntent, setDeleteIntent] = useState<{ id: string; name: string } | null>(null);
    const [deletePassword, setDeletePassword] = useState("");

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // CSV import state
    const importRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    // Email state
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        setFetching(true);
        const res = await fetch("/api/seasons", { cache: "no-store" });
        const data = await res.json();
        setSeasons(Array.isArray(data) ? data : []);
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
        }
        setLoading(false);
    };

    const submitAddSeason = async () => {
        if (!newSeasonName) { alert("Please enter a season name."); return; }
        if (seasonPassword !== "000") { alert("Invalid password"); return; }
        setLoading(true);
        const res = await fetch("/api/seasons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newSeasonName, password: seasonPassword }),
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

    const submitActivateSeason = async () => {
        if (!activateIntent) return;
        if (activatePassword !== "000") { alert("Invalid password"); return; }
        setLoading(true);
        const res = await fetch(`/api/seasons/${activateIntent.id}/activate`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: activatePassword }),
        });
        if (res.ok) {
            fetchSeasons();
            setActivateIntent(null);
            setActivatePassword("");
        } else {
            alert("Failed to activate season.");
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

    const handleExport = () => {
        window.location.href = "/api/export";
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        setEmailStatus(null);
        const secret = prompt("Enter CRON_SECRET to send the email report (check your Render env vars):");
        if (!secret) { setSendingEmail(false); return; }
        const res = await fetch("/api/email/weekly-report", {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}` },
        });
        const data = await res.json();
        if (res.ok) {
            setEmailStatus(`✅ Report sent to salojee@jaws.co.za (${data.gamesExported} games).`);
        } else {
            setEmailStatus(`❌ Failed: ${data.error}`);
        }
        setSendingEmail(false);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportStatus(null);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/import", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
            setImportStatus(`✅ Imported ${data.imported} games (${data.skipped} skipped as duplicates).`);
            fetchSeasons();
        } else {
            setImportStatus(`❌ Import failed: ${data.error}`);
        }
        setImporting(false);
        // Reset file input
        if (importRef.current) importRef.current.value = "";
    };

    return (
        <main>
            <div className="container" style={{ maxWidth: 640 }}>
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your pool tracker configuration</p>
                </div>

                {/* ── Quick Reset ── */}
                <div className="card mb-24 animate-in">
                    <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>Quick League Reset</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>
                        Archive the current active season and start a new one automatically.
                    </p>
                    {!showResetConfirm ? (
                        <button onClick={() => setShowResetConfirm(true)} disabled={loading} className="btn btn-primary">
                            {loading ? "Processing..." : "🏁 Reset Current League"}
                        </button>
                    ) : (
                        <div style={{ background: "rgba(255, 159, 67, 0.1)", padding: 16, borderRadius: 8, border: "1px solid var(--accent-yellow)" }}>
                            <div style={{ fontWeight: 600, color: "var(--accent-yellow)", marginBottom: 8 }}>⚠️ Are you absolutely sure?</div>
                            <p style={{ fontSize: "0.875rem", marginBottom: 16 }}>
                                This will close the current active season and start a fresh one. This cannot be reversed!
                            </p>
                            <div className="flex gap-8">
                                <button className="btn btn-primary" onClick={handleReset} style={{ flex: 1, background: "var(--accent-yellow)", color: "#000" }}>Confirm Reset</button>
                                <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)} disabled={loading} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Season Management ── */}
                <div className="card mb-24 animate-in">
                    <div className="flex items-center justify-between mb-16">
                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>Season Management</div>
                        <button className="btn btn-secondary" onClick={() => setShowAddForm(!showAddForm)} disabled={loading} style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
                            {showAddForm ? "Cancel" : "+ Add Custom Season"}
                        </button>
                    </div>

                    {showAddForm && (
                        <div style={{ background: "var(--bg-color)", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-color)" }}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: "0.875rem" }}>Season Name</label>
                                <input type="text" className="form-input" placeholder="e.g. Season 2" value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} disabled={loading} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: "0.875rem" }}>Management Password</label>
                                <input type="password" className="form-input" placeholder="Enter 000" value={seasonPassword} onChange={(e) => setSeasonPassword(e.target.value)} disabled={loading} />
                            </div>
                            <button className="btn btn-primary" onClick={submitAddSeason} disabled={loading} style={{ width: "100%" }}>Confirm &amp; Add</button>
                        </div>
                    )}

                    {/* Activate intent form */}
                    {activateIntent && (
                        <div style={{ background: "rgba(68,138,255,0.08)", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid rgba(68,138,255,0.3)" }}>
                            <div style={{ fontWeight: 600, color: "var(--accent-blue)", marginBottom: 8 }}>Set &quot;{activateIntent.name}&quot; as Active Season</div>
                            <p style={{ fontSize: "0.875rem", marginBottom: 12 }}>Enter admin password to confirm. All games added after this will belong to this season.</p>
                            <input type="password" className="form-input" placeholder="Enter 000" value={activatePassword} onChange={(e) => setActivatePassword(e.target.value)} disabled={loading} style={{ marginBottom: 10 }} />
                            <div className="flex gap-8">
                                <button className="btn btn-primary" onClick={submitActivateSeason} disabled={loading} style={{ flex: 1 }}>Confirm</button>
                                <button className="btn btn-secondary" onClick={() => { setActivateIntent(null); setActivatePassword(""); }} disabled={loading} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {deleteIntent && (
                        <div style={{ background: "rgba(255, 71, 87, 0.05)", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid var(--accent-red)" }}>
                            <div style={{ fontWeight: 600, color: "var(--accent-red)", marginBottom: 8 }}>Permanent Deletion of {deleteIntent.name}</div>
                            <p style={{ fontSize: "0.875rem", marginBottom: 12 }}>This will permanently delete ALL games within this season. Cannot be undone.</p>
                            <input type="password" className="form-input" placeholder="Enter 000" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} disabled={loading} style={{ marginBottom: 10 }} />
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
                            {seasons.map((s) => (
                                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                            {s.name}
                                            {s.isActive && <span className="badge badge-win" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Active</span>}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Started: {new Date(s.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {!s.isActive && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setActivateIntent({ id: s.id, name: s.name })}
                                                disabled={loading}
                                                style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                                            >
                                                ✅ Set Active
                                            </button>
                                        )}
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
                                                border: "1px solid var(--accent-red)",
                                            }}
                                            title={s.isActive ? "Cannot delete the active season" : "Delete season"}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── CSV Export / Import ── */}
                <div className="card mb-24 animate-in">
                    <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>Data Backup &amp; Restore</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>
                        Export all game history as a CSV file. If the app is ever redeployed, import the CSV to restore everything automatically.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <button className="btn btn-primary" onClick={handleExport} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            ⬇️ Export Game History (CSV)
                        </button>

                        <div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => importRef.current?.click()}
                                disabled={importing}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                            >
                                {importing ? <span className="spinner" /> : "⬆️ Import Game History (CSV)"}
                            </button>
                            <input ref={importRef} type="file" accept=".csv,text/csv" onChange={handleImport} style={{ display: "none" }} />
                        </div>

                        {importStatus && (
                            <div style={{
                                padding: "10px 14px",
                                borderRadius: 8,
                                background: importStatus.startsWith("✅") ? "rgba(46,213,115,0.1)" : "rgba(255,71,87,0.1)",
                                border: `1px solid ${importStatus.startsWith("✅") ? "rgba(46,213,115,0.3)" : "var(--accent-red)"}`,
                                fontSize: "0.875rem",
                            }}>
                                {importStatus}
                            </div>
                        )}

                        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>📧 Weekly auto-email: every Monday at 08:00 to salojee@jaws.co.za</div>
                            <button
                                className="btn btn-secondary"
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                            >
                                {sendingEmail ? <span className="spinner" /> : "📧 Send Report Email Now"}
                            </button>
                            {emailStatus && (
                                <div style={{
                                    marginTop: 8,
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: emailStatus.startsWith("✅") ? "rgba(46,213,115,0.1)" : "rgba(255,71,87,0.1)",
                                    border: `1px solid ${emailStatus.startsWith("✅") ? "rgba(46,213,115,0.3)" : "var(--accent-red)"}`,
                                    fontSize: "0.875rem",
                                }}>
                                    {emailStatus}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── About ── */}
                <div className="card animate-in" style={{ opacity: 0.6 }}>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>About Pool Tracker</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        Version 1.4.0 – Supabase Edition<br />
                        Management Password: Required for destructive actions.
                    </p>
                </div>
            </div>
        </main>
    );
}
