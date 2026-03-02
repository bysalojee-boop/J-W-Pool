"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewPlayerPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !age) { setError("Name and age are required."); return; }
        setLoading(true);
        setError("");
        const fd = new FormData();
        fd.append("name", name);
        fd.append("age", age);
        if (imageFile) fd.append("image", imageFile);

        const res = await fetch("/api/players", { method: "POST", body: fd });
        if (res.ok) {
            router.push("/players");
        } else {
            const d = await res.json();
            setError(d.error || "Failed to create player.");
            setLoading(false);
        }
    };

    return (
        <main>
            <div className="container" style={{ maxWidth: 560 }}>
                <div className="page-header">
                    <h1 className="page-title">Add Player</h1>
                    <p className="page-subtitle">Register a new pool player</p>
                </div>

                <div className="card animate-in">
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Profile Photo (optional)</label>
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

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? <span className="spinner" /> : "Add Player"}
                        </button>
                    </form>
                </div>
                <div style={{ height: 48 }} />
            </div>
        </main>
    );
}
