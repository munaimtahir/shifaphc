import React, { useEffect, useState } from "react";
import { fetchIndicators, Indicator } from "./api";

export default function App() {
  const [items, setItems] = useState<Indicator[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { fetchIndicators().then(setItems).catch(console.error); }, []);

  async function onSearch() {
    const data = await fetchIndicators(q);
    setItems(data);
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Accred Checklist OS</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input style={{ flex: 1, padding: 8 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search indicators..." />
        <button style={{ padding: "8px 12px" }} onClick={onSearch}>Search</button>
      </div>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>Section</th><th>Indicator</th><th>Frequency</th><th>Status</th>
        </tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
              <td style={{ width: 220 }}>{it.section}</td>
              <td>{it.indicator_text}</td>
              <td style={{ width: 120 }}>{it.frequency}</td>
              <td style={{ width: 120 }}>{it.due_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
