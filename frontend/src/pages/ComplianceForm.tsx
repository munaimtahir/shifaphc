import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { createCompliance, updateCompliance, fetchIndicator, fetchComplianceRecord, Indicator } from "../api";
import { useToast } from "../components/Toast";

export default function ComplianceForm() {
    const { id } = useParams<{ id: string }>();
    const [params] = useSearchParams();
    const indicatorIdParam = params.get("indicator");
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [indicatorId, setIndicatorId] = useState<string | null>(indicatorIdParam);
    const [compliantOn, setCompliantOn] = useState(new Date().toISOString().split("T")[0]);
    const [validUntil, setValidUntil] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (id) {
            setFetching(true);
            fetchComplianceRecord(id).then(record => {
                setCompliantOn(record.compliant_on);
                setValidUntil(record.valid_until || "");
                setNotes(record.notes || "");
                setIndicatorId(record.indicator);
                return fetchIndicator(record.indicator);
            }).then(setIndicator).catch(err => {
                showToast("Failed to load compliance record", "error");
            }).finally(() => setFetching(false));
        } else if (indicatorIdParam) {
            fetchIndicator(indicatorIdParam).then(setIndicator);
        }
    }, [id, indicatorIdParam, showToast]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!indicatorId) return;
        setLoading(true);
        try {
            if (id) {
                await updateCompliance(id, {
                    compliant_on: compliantOn,
                    valid_until: validUntil || null,
                    notes
                });
                showToast("Compliance record updated", "success");
            } else {
                await createCompliance({
                    indicator: indicatorId,
                    compliant_on: compliantOn,
                    valid_until: validUntil || null,
                    notes
                });
                showToast("Compliance record created", "success");
            }
            navigate(`/indicators/${indicatorId}`);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Failed to save", "error");
            setLoading(false);
        }
    }

    if (fetching) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
    if (!indicatorId && !id) return <div style={{ padding: 40 }}>Missing indicator context</div>;

    return (
        <div style={{ maxWidth: 600, margin: "24px auto", padding: 24, background: 'white', borderRadius: 12, border: '1px solid #eee' }}>
            <h2 style={{ marginTop: 0 }}>{id ? "Edit Compliance Record" : "New Compliance Record"}</h2>
            {indicator && <div style={{ marginBottom: 24, color: "#666", fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 'bold' }}>Indicator:</span> {indicator.indicator_text}
            </div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500 }}>
                    Compliant On*
                    <input type="date" required value={compliantOn} onChange={e => setCompliantOn(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500 }}>
                    Valid Until
                    <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>Leave blank to auto-calculate based on frequency ({indicator?.frequency})</div>
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500 }}>
                    Notes / Comments
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ddd', minHeight: 120 }} placeholder="Add any relevant notes here..." />
                </label>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="submit" disabled={loading} style={{
                        flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "#fff",
                        border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 'bold'
                    }}>
                        {loading ? "Saving..." : id ? "Update Record" : "Save Compliance Record"}
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
