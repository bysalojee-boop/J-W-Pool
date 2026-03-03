"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditPlayerPage() {
    const router = useRouter();
    const params = useParams();
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/players/${params.id}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.player) {
                    setName(d.player.name);
                    setAge(d.player.age.toString());
                    if (d.player.imageUrl) setPreview(d.player.imageUrl);
                }
                setLoading(false);
            });
    }, [params.id]);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setPreview(result);
            setImageBase64(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !age) { setError("Name and age are required."); return; }
        setSaving(true);
        setError("");

        const body: any = { name, age: parseInt(age, 10) };
        if (imageBase64 !== undefined) body.imageUrl = imageBase64;

        const res = await fetch(`/api/players/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            router.push(`/players/${params.id}`);
        } else {
            const d = await res.json();
            setError(d.error || "Failed to update player.");
            setSaving(false);
        }
    };

    if (loading) return <div className="empty-state animate-in"><div className="spinner" style={{ margin: "0 auto" }} /></div>;

    return (
        <main>
            <div className="container" style={{ maxWidth: 560 }}>
                <div className="page-header">
                    <h1 className="page-title">Edit Player</h1>
                    <p className="page-subtitle">Update player information</p>
                </div>

                <div className="card animate-in">
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Profile Photo</label>
                            <div className="form-upload" onClick={() => fileRef.current?.click()}>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} />
                                {preview ? (
                                    <img src={preview} alt="preview" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto" }} />
                                ) : (
                                    <div>
                                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📷</div>
                                        <div className="form-upload-text">Click to upload a photo</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                className="form-input"
                                type="text"
                                placeholder="e.g. John Smith"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="age">Age</label>
                            <input
                                id="age"
                                className="form-input"
                                type="number"
                                min="5"
                                max="120"
                                placeholder="e.g. 28"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button type="button" className="btn btn-secondary w-full" onClick={() => router.back()}>Cancel</button>
                            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                                {saving ? <span className="spinner" /> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}
