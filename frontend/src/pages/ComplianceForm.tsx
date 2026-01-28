import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createCompliance, fetchIndicator, Indicator } from "../api";

export default function ComplianceForm() {
    const [params] = useSearchParams();
    const indicatorId = params.get("indicator");
    const navigate = useNavigate();

    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [compliantOn, setCompliantOn] = useState(new Date().toISOString().split("T")[0]);
    const [validUntil, setValidUntil] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (indicatorId) fetchIndicator(indicatorId).then(setIndicator);
    }, [indicatorId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!indicatorId) return;
        setLoading(true);
        try {
            await createCompliance({
                indicator: indicatorId,
                compliant_on: compliantOn,
                valid_until: validUntil || null,
                notes
            });
            navigate(`/indicators/${indicatorId}`);
        } catch (e) {
            console.error(e);
            alert("Failed to save");
            setLoading(false);
        }
    }

    if (!indicatorId) return <div>Missing indicator ID</div>;

    return (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>New Compliance Record</h2>
            {indicator && <div style={{ marginBottom: 16, color: "#666" }}>For: {indicator.indicator_text}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label>
                    Compliant On*
                    <input type="date" required value={compliantOn} onChange={e => setCompliantOn(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
                </label>
                <label>
                    Valid Until (leave blank to auto-calculate based on frequency)
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
                </label>
                <label>
                    Notes
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4, minHeight: 80 }} />
                </label>

                <button type="submit" disabled={loading} style={{ padding: "10px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                    {loading ? "Saving..." : "Save Compliance Record"}
                </button>
            </form>
        </div>
    );
}
