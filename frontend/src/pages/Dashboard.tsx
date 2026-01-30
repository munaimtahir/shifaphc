import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchIndicators, Indicator } from "../api";
import { useAuth } from "../auth";

export default function Dashboard() {
    const { canMutate } = useAuth();
    const [items, setItems] = useState<Indicator[]>([]);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => {
        load();
    }, [statusFilter]); // Reload when filter changes

    async function load(query?: string) {
        setLoading(true);
        try {
            const data = await fetchIndicators(query || q, statusFilter);
            setItems(data);
            setCurrentPage(1); // Reset to first page on new search/filter
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function onSearch(e: React.FormEvent) {
        e.preventDefault();
        load(q);
    }

    // Client-side pagination logic
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    const totalPages = Math.ceil(items.length / pageSize);

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{
                marginBottom: 24, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ flex: 1 }}>
                    <form onSubmit={onSearch} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <div style={{ flex: 2, minWidth: 200 }}>
                            <input
                                style={{
                                    width: "100%", padding: "10px 14px", fontSize: 16,
                                    border: "1px solid #e5e7eb", borderRadius: 8, outline: 'none'
                                }}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by text, section, or standard..."
                            />
                        </div>

                        <div style={{ flex: 1, minWidth: 150 }}>
                            <select
                                style={{
                                    width: "100%", padding: "10px 14px", fontSize: 16,
                                    border: "1px solid #e5e7eb", borderRadius: 8, outline: 'none',
                                    background: 'white'
                                }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="COMPLIANT">Compliant</option>
                                <option value="DUE_SOON">Due Soon</option>
                                <option value="OVERDUE">Overdue</option>
                                <option value="NOT_STARTED">Not Started</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            style={{
                                padding: "10px 24px", backgroundColor: "#2563eb", color: "#fff",
                                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 'bold'
                            }}
                        >
                        </button>
                    </form>
                </div>

                {canMutate && (
                    <div style={{ display: 'flex', gap: 12, marginLeft: 12 }}>
                        <Link to="/indicators/new" style={{
                            padding: "10px 20px", backgroundColor: "#059669", color: "#fff",
                            textDecoration: "none", borderRadius: 8, fontWeight: 'bold', fontSize: '14px'
                        }}>
                            + Add Indicator
                        </Link>
                        <Link to="/indicators/import" style={{
                            padding: "10px 20px", backgroundColor: "#4f46e5", color: "#fff",
                            textDecoration: "none", borderRadius: 8, fontWeight: 'bold', fontSize: '14px'
                        }}>
                            + Compliance List
                        </Link>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading indicators...</div>
            ) : (
                <>
                    <div style={{
                        background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
                        overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                    <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Section / Standard</th>
                                    <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Indicator Text</th>
                                    <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Frequency</th>
                                    <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.map(it => (
                                    <tr key={it.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "top" }}>
                                        <td style={{ padding: "16px 20px", width: 200 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{it.section}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{it.standard}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link
                                                to={`/indicators/${it.id}`}
                                                style={{ fontWeight: 500, color: "#2563eb", textDecoration: "none", lineHeight: 1.4 }}
                                            >
                                                {it.indicator_text}
                                            </Link>
                                        </td>
                                        <td style={{ padding: "16px 20px", width: 120, fontSize: '0.9rem', color: '#374151' }}>
                                            {it.frequency}
                                        </td>
                                        <td style={{ padding: "16px 20px", width: 140 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: "4px 10px", borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
                                                    backgroundColor: it.due_status === 'COMPLIANT' ? '#ecfdf5' : it.due_status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                                                    color: it.due_status === 'COMPLIANT' ? '#064e3b' : it.due_status === 'OVERDUE' ? '#991b1b' : '#92400e',
                                                    border: `1px solid ${it.due_status === 'COMPLIANT' ? '#d1fae5' : it.due_status === 'OVERDUE' ? '#fee2e2' : '#fef3c7'}`
                                                }}>
                                                    {it.due_status}
                                                </span>
                                                {canMutate && (
                                                    <Link to={`/indicators/${it.id}/edit`} style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none' }}>Edit</Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                                            No indicators found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, items.length)} of {items.length} indicators
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select
                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                                <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '6px 16px', background: 'white', border: 'none',
                                            borderRight: '1px solid #d1d5db', cursor: currentPage === 1 ? 'default' : 'pointer',
                                            color: currentPage === 1 ? '#d1d5db' : '#374151'
                                        }}
                                    >
                                        Prev
                                    </button>
                                    <div style={{ padding: '6px 16px', background: '#f9fafb', fontSize: '0.9rem', fontWeight: 600 }}>
                                        {currentPage} / {totalPages}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        style={{
                                            padding: '6px 16px', background: 'white', border: 'none',
                                            cursor: currentPage === totalPages ? 'default' : 'pointer',
                                            color: currentPage === totalPages ? '#d1d5db' : '#374151'
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
