import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAuditSummary, AuditSummary } from "../api";

export default function AuditDashboard() {
    const [data, setData] = useState<AuditSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAuditSummary()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Failed to load audit summary</div>;

    return (
        <div>
            <h2 style={{ marginBottom: 24 }}>Audit Summary</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                <Link to="/?due_status=DUE_SOON" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: 24, borderRadius: 8, background: '#fffbe6', border: '1px solid #ffe58f', color: '#b7791f' }}>
                        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data.counts.DUE_SOON || 0}</div>
                        <div>Due Soon</div>
                    </div>
                </Link>

                <Link to="/?due_status=OVERDUE" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: 24, borderRadius: 8, background: '#fff5f5', border: '1px solid #ffa39e', color: '#c53030' }}>
                        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data.counts.OVERDUE || 0}</div>
                        <div>Overdue</div>
                    </div>
                </Link>

                <Link to="/?due_status=COMPLIANT" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: 24, borderRadius: 8, background: '#e6fffa', border: '1px solid #87e8de', color: '#047857' }}>
                        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data.counts.COMPLIANT || 0}</div>
                        <div>Compliant</div>
                    </div>
                </Link>

                <div style={{ padding: 24, borderRadius: 8, background: '#f0f0f0', border: '1px solid #d9d9d9', color: '#555' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data.counts.NOT_STARTED || 0}</div>
                    <div>Not Started</div>
                </div>
            </div>
        </div>
    );
}
