import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { uploadEvidence, fetchIndicator, Indicator } from "../api";
import { useToast } from "../components/Toast";

export default function EvidenceUpload() {
    const [params] = useSearchParams();
    const indicatorId = params.get("indicator");
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (indicatorId) {
            fetchIndicator(indicatorId)
                .then(setIndicator)
                .finally(() => setFetching(false));
        }
    }, [indicatorId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!indicatorId) return;
        if (!file && !note) {
            showToast("Please provide a file or a note", "error");
            return;
        }

        setLoading(true);

        const fd = new FormData();
        fd.append("indicator", indicatorId);
        if (file) {
            fd.append("file", file);
            fd.append("type", "FILE");
        } else {
            fd.append("type", "NOTE");
        }
        if (note) fd.append("note_text", note);

        try {
            await uploadEvidence(fd);
            showToast("Evidence uploaded successfully", "success");
            navigate(`/indicators/${indicatorId}`);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Upload failed", "error");
            setLoading(false);
        }
    }

    if (fetching) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
    if (!indicatorId) return <div style={{ padding: 40 }}>Missing indicator context</div>;

    return (
        <div style={{ maxWidth: 600, margin: "24px auto", padding: 24, background: 'white', borderRadius: 12, border: '1px solid #eee' }}>
            <h2 style={{ marginTop: 0 }}>Upload Evidence</h2>
            {indicator && <div style={{ marginBottom: 24, color: "#666", fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 'bold' }}>Indicator:</span> {indicator.indicator_text}
            </div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500 }}>
                    File
                    <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>Supported: PDF, DOCX, JPG, PNG, XLSX (Max 10MB)</div>
                    <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} style={{ width: "100%", padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500 }}>
                    Note / Description
                    <textarea value={note} onChange={e => setNote(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ddd', minHeight: 120 }} placeholder="Add a description or paste a note here..." />
                </label>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="submit" disabled={loading} style={{
                        flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "#fff",
                        border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 'bold'
                    }}>
                        {loading ? "Uploading..." : "Upload Evidence"}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} style={{
                        padding: "12px 24px", backgroundColor: "#fff", color: "#666",
                        border: "1px solid #ddd", borderRadius: 6, cursor: "pointer"
                    }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
