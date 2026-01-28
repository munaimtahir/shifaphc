import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { uploadEvidence, fetchIndicator, Indicator } from "../api";

export default function EvidenceUpload() {
    const [params] = useSearchParams();
    const indicatorId = params.get("indicator");
    const navigate = useNavigate();

    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (indicatorId) fetchIndicator(indicatorId).then(setIndicator);
    }, [indicatorId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!indicatorId) return;
        setLoading(true);

        const fd = new FormData();
        fd.append("indicator", indicatorId);
        if (file) fd.append("file", file);
        if (note) fd.append("note_text", note);
        fd.append("type", file ? "file" : "note");

        try {
            await uploadEvidence(fd);
            navigate(`/indicators/${indicatorId}`);
        } catch (e) {
            console.error(e);
            alert("Upload failed");
            setLoading(false);
        }
    }

    if (!indicatorId) return <div>Missing indicator ID</div>;

    return (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Upload Evidence</h2>
            {indicator && <div style={{ marginBottom: 16, color: "#666" }}>For: {indicator.indicator_text}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label>
                    File
                    <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
                </label>
                <label>
                    Note / Description
                    <textarea value={note} onChange={e => setNote(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4, minHeight: 80 }} />
                </label>

                <button type="submit" disabled={loading} style={{ padding: "10px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                    {loading ? "Uploading..." : "Upload Evidence"}
                </button>
            </form>
        </div>
    );
}
