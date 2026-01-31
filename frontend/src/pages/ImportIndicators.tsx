import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProject, importProjectIndicators, Project } from "../api";

type PreviewRow = Record<string, string>;

const REQUIRED_COLUMNS = ["indicator_code", "section", "text", "frequency", "mandatory"];

function parseCsvLine(line: string) {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map((value) => value.trim());
}

function parseCsv(text: string) {
    const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (rows.length === 0) {
        return { headers: [], data: [] as PreviewRow[] };
    }
    const headers = parseCsvLine(rows[0]).map((header) => header.trim());
    const data: PreviewRow[] = [];
    rows.slice(1).forEach((line) => {
        const values = parseCsvLine(line);
        const row: PreviewRow = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });
        data.push(row);
    });
    return { headers, data };
}

export default function ImportIndicators() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [resultMsg, setResultMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchProject(id).then(setProject).catch((err) => console.error(err));
    }, [id]);

    async function handleFileChange(selected: File | null) {
        setFile(selected);
        setResultMsg(null);
        setErrors([]);
        setPreview([]);
        setHeaders([]);
        if (!selected) return;
        const text = await selected.text();
        const parsed = parseCsv(text);
        setHeaders(parsed.headers);
        setPreview(parsed.data.slice(0, 5));
        const normalizedHeaders = parsed.headers.map((h) => h.trim().toLowerCase());
        const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));
        if (missing.length) {
            setErrors([`Missing required columns: ${missing.join(", ")}`]);
        }
    }

    async function handleImport() {
        if (!file || !id) return;
        setLoading(true);
        setResultMsg(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await importProjectIndicators(id, fd);
            const failed = res.failed?.length || 0;
            setResultMsg(`Imported ${res.created} indicators. ${failed ? `${failed} rows failed validation.` : "All rows imported successfully."}`);
            if (failed) {
                setErrors(res.failed.map((item: any) => `Row ${item.row}: ${item.errors.join("; ")}`));
            }
        } catch (e: any) {
            setResultMsg(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    function downloadSample() {
        const content = "indicator_code,section,text,frequency,mandatory\nSTD-1,Admissions,Applicants must provide transcripts,ANNUALLY,yes\nSTD-2,Student Support,Advising plan is reviewed quarterly,QUARTERLY,no";
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "project_indicators_sample.csv";
        a.click();
    }

    if (!id) {
        return <div style={{ padding: 24 }}>Project not found.</div>;
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: 16, fontSize: "0.9rem", color: "#666" }}>
                <Link to="/projects" style={{ color: "#2563eb", textDecoration: "none" }}>Projects</Link>
                <span style={{ margin: "0 8px" }}>/</span>
                <Link to={`/projects/${id}`} style={{ color: "#2563eb", textDecoration: "none" }}>{project?.name || "Project"}</Link>
                <span style={{ margin: "0 8px" }}>/</span>
                <span>Import Indicators</span>
            </div>

            <h2>Import Indicators (CSV)</h2>
            <div style={{ marginBottom: 24, background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
                <p style={{ marginTop: 0 }}>
                    Upload a CSV to bulk import indicators into <strong>{project?.name || "this project"}</strong>.
                    Required columns: {REQUIRED_COLUMNS.join(", ")}.
                </p>
                <button onClick={downloadSample} style={{ background: "none", border: "1px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>
                    Download Sample CSV
                </button>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input type="file" accept=".csv" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                <button
                    onClick={handleImport}
                    disabled={!file || loading || errors.length > 0}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: !file || errors.length > 0 ? "#e5e7eb" : "#0066cc",
                        color: !file || errors.length > 0 ? "#9ca3af" : "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: !file || errors.length > 0 ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Importing..." : "Preview & Import"}
                </button>
            </div>

            {preview.length > 0 && (
                <div style={{ marginTop: 24, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "white" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Preview (first 5 rows)</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {headers.map((header) => (
                                    <th key={header} style={{ padding: "10px 12px", fontSize: "0.75rem", textTransform: "uppercase", color: "#6b7280" }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    {headers.map((header) => (
                                        <td key={header} style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#374151" }}>
                                            {row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {errors.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, border: "1px solid #fca5a5", borderRadius: 4, background: "#fef2f2", color: "#991b1b" }}>
                    <strong>Validation errors:</strong>
                    <ul style={{ margin: "8px 0 0 16px" }}>
                        {errors.map((err) => (
                            <li key={err}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {resultMsg && (
                <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 4 }}>
                    {resultMsg}
                </div>
            )}
        </div>
    );
}
