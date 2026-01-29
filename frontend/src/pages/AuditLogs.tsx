import React, { useEffect, useMemo, useState } from "react";
import { AuditLogEntry, fetchAuditLogs, getAuditLogsExportUrl } from "../api";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actor: "",
    action: "",
    entity_type: "",
    q: "",
    from: "",
    to: "",
  });

  const query = useMemo(
    () => ({
      actor: filters.actor || undefined,
      action: filters.action || undefined,
      entity_type: filters.entity_type || undefined,
      q: filters.q || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters]
  );

  useEffect(() => {
    setLoading(true);
    fetchAuditLogs(query)
      .then((data) => setLogs(data.results || []))
      .finally(() => setLoading(false));
  }, [query]);

  const exportUrl = getAuditLogsExportUrl(query);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Audit Logs</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Actor (id or username)"
          value={filters.actor}
          onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
        />
        <input
          placeholder="Action"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        <input
          placeholder="Entity type"
          value={filters.entity_type}
          onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
        />
        <input
          placeholder="Search summary"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href={exportUrl} style={{ textDecoration: "none", color: "#0066cc" }}>
          Export CSV
        </a>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Timestamp</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Actor</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Action</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Entity</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ padding: 8 }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{log.actor_username || log.actor || "System"}</td>
                  <td style={{ padding: 8 }}>{log.action}</td>
                  <td style={{ padding: 8 }}>
                    {log.entity_type} ({log.entity_id})
                  </td>
                  <td style={{ padding: 8 }}>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
