import React, { useState } from "react";
import { importIndicators } from "../api";

export default function ImportIndicators() {
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleImport() {
        if (!file) return;
        setLoading(true);
        setMsg("");
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await importIndicators(fd);
            setMsg(`Imported ${res.created} indicators.`);
        } catch (e: any) {
            setMsg("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    function downloadSample() {
        const content = "Section,Standard,Indicator,Evidence Required,Responsible Person\nExample Section,1.1,Example Indicator,Policy Document,Dr. Smith";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "indicators_sample.csv";
        a.click();
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <h2>Import Indicators (CSV)</h2>
            <div style={{ marginBottom: 24, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                <p style={{ marginTop: 0 }}>Select a CSV file to bulk import indicators. Ensure columns match the sample.</p>
                <button onClick={downloadSample} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Download Sample CSV</button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
                <button onClick={handleImport} disabled={!file || loading} style={{ padding: "8px 16px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                    {loading ? "Importing..." : "Upload & Import"}
                </button>
            </div>

            {msg && <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>{msg}</div>}
        </div>
    );
}
