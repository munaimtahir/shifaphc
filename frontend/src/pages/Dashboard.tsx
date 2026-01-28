import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchIndicators, Indicator } from "../api";

export default function Dashboard() {
    const [items, setItems] = useState<Indicator[]>([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load(query?: string) {
        setLoading(true);
        try {
            const data = await fetchIndicators(query);
            setItems(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    function onSearch() { load(q); }

    return (
        <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input style={{ flex: 1, padding: 8, fontSize: 16, border: "1px solid #ccc", borderRadius: 4 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search indicators..." />
                <button style={{ padding: "8px 16px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }} onClick={onSearch}>Search</button>
            </div>

            {loading ? <div>Loading...</div> : (
                <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
                    <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #ddd", background: "#f9f9f9" }}>
                        <th style={{ padding: 10 }}>Section</th><th>Indicator</th><th>Frequency</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                                <td style={{ width: 150, padding: 10 }}>{it.section}<br /><span style={{ fontSize: '0.8em', color: '#666' }}>{it.standard}</span></td>
                                <td style={{ padding: 10 }}>
                                    <Link to={`/indicators/${it.id}`} style={{ fontWeight: 500, color: "#0066cc", textDecoration: "none" }}>{it.indicator_text}</Link>
                                </td>
                                <td style={{ width: 120, padding: 10 }}>{it.frequency}</td>
                                <td style={{ width: 120, padding: 10 }}>
                                    <span style={{
                                        padding: "4px 8px", borderRadius: 4, fontSize: '0.9em',
                                        backgroundColor: it.due_status === 'COMPLIANT' ? '#e6fffa' : it.due_status === 'OVERDUE' ? '#fff5f5' : '#fffbe6',
                                        color: it.due_status === 'COMPLIANT' ? '#047857' : it.due_status === 'OVERDUE' ? '#c53030' : '#b7791f'
                                    }}>
                                        {it.due_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
