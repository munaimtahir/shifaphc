import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    fetchIndicator, fetchComplianceRecords, fetchEvidenceItems,
    Indicator, ComplianceRecord, EvidenceItem, getFileUrl,
    revokeCompliance, deleteEvidence, updateEvidence
} from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';

export default function IndicatorDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

    const [loadingInd, setLoadingInd] = useState(true);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [loadingEvs, setLoadingEvs] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!id) return;

        setLoadingInd(true);
        setError(null);

        try {
            const ind = await fetchIndicator(id);
            setIndicator(ind);
        } catch (err: any) {
            setError(err.message || 'Failed to load indicator');
        } finally {
            setLoadingInd(false);
        }

        if (user) {
            loadRecords();
            loadEvidence();
        }
    }, [id, user]);

    const loadRecords = async () => {
        if (!id) return;
        setLoadingRecs(true);
        try {
            const recs = await fetchComplianceRecords(id);
            // Sort by date descending
            setRecords(recs.sort((a, b) => new Date(b.compliant_on).getTime() - new Date(a.compliant_on).getTime()));
        } catch (err) {
            console.error('Failed to load records', err);
        } finally {
            setLoadingRecs(false);
        }
    };

    const loadEvidence = async () => {
        if (!id) return;
        setLoadingEvs(true);
        try {
            const evs = await fetchEvidenceItems(id);
            // Sort by newest first
            setEvidence(evs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (err) {
            console.error('Failed to load evidence', err);
        } finally {
            setLoadingEvs(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRevoke = async (recordId: string) => {
        const reason = window.prompt("Type REVOKE to confirm and provide a reason:");
        if (reason === null) return;
        if (!reason.includes("REVOKE")) {
            showToast("You must type REVOKE to confirm", "error");
            return;
        }

        try {
            await revokeCompliance(recordId, reason);
            showToast("Compliance record revoked successfully", "success");
            loadRecords();
            // Refresh indicator to update status
            const ind = await fetchIndicator(id!);
            setIndicator(ind);
        } catch (err: any) {
            showToast(err.message || "Failed to revoke record", "error");
        }
    };

    const handleDeleteEvidence = async (evId: string) => {
        if (!window.confirm("Are you sure you want to delete this evidence item? This action cannot be undone.")) return;

        const confirm = window.prompt("Type DELETE to confirm:");
        if (confirm !== "DELETE") {
            showToast("Deletions must be confirmed by typing DELETE", "error");
            return;
        }

        try {
            await deleteEvidence(evId);
            showToast("Evidence deleted", "success");
            loadEvidence();
        } catch (err: any) {
            showToast(err.message || "Failed to delete evidence", "error");
        }
    };

    const handleEditEvidence = async (ev: EvidenceItem) => {
        const newNote = window.prompt("Edit evidence note:", ev.note_text || "");
        if (newNote === null) return;

        try {
            await updateEvidence(ev.id, { note_text: newNote });
            showToast("Evidence updated", "success");
            loadEvidence();
        } catch (err: any) {
            showToast(err.message || "Failed to update evidence", "error");
        }
    };

    if (loadingInd) return <div style={{ padding: 40, textAlign: 'center' }}>Loading indicator workbench...</div>;
    if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error} <button onClick={loadData}>Retry</button></div>;
    if (!indicator) return <div style={{ padding: 40 }}>Indicator not found</div>;

    return (
        <div style={{ paddingBottom: 60 }}>
            {/* Breadcrumbs */}
            <div style={{ marginBottom: 16, fontSize: '0.9rem', color: '#666' }}>
                <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Indicators</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span>{indicator.standard}</span>
            </div>

            {/* Quick Actions Panel */}
            {user && (
                <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px 0', borderBottom: '1px solid #eee',
                    marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center'
                }}>
                    <div style={{ fontWeight: 'bold', marginRight: 'auto' }}>Workbench Actions</div>
                    <Link to={`/compliance/new?indicator=${indicator.id}`} style={{
                        padding: "8px 16px", backgroundColor: "#059669", color: "#fff",
                        textDecoration: "none", borderRadius: 6, fontSize: '0.9rem', fontWeight: 500
                    }}>
                        + Add Compliance
                    </Link>
                    <Link to={`/evidence/upload?indicator=${indicator.id}`} style={{
                        padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff",
                        textDecoration: "none", borderRadius: 6, fontSize: '0.9rem', fontWeight: 500
                    }}>
                        + Upload Evidence
                    </Link>
                    <Link to="/audit" style={{
                        padding: "8px 16px", backgroundColor: "#f3f4f6", color: "#374151",
                        textDecoration: "none", borderRadius: 6, fontSize: '0.9rem', border: '1px solid #d1d5db'
                    }}>
                        View Audit
                    </Link>
                </div>
            )}

            <div style={{
                border: '1px solid #e5e7eb', borderRadius: 12, padding: 24,
                background: 'white', marginBottom: 32, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, color: '#4b5563', fontWeight: 'bold' }}>
                                {indicator.section}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{indicator.standard}</span>
                        </div>
                        <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 28, lineHeight: 1.2 }}>{indicator.indicator_text}</h1>

                        <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem', color: '#4b5563' }}>
                            <div><strong>Frequency:</strong> {indicator.frequency}</div>
                            <div><strong>Responsible:</strong> {indicator.responsible_person || 'Not assigned'}</div>
                        </div>
                    </div>
                    <div style={{
                        padding: "8px 16px", borderRadius: 8, fontWeight: 'bold', textAlign: 'center', minWidth: 120,
                        backgroundColor: indicator.due_status === 'COMPLIANT' ? '#ecfdf5' : indicator.due_status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                        color: indicator.due_status === 'COMPLIANT' ? '#065f46' : indicator.due_status === 'OVERDUE' ? '#991b1b' : '#92400e',
                        border: `1px solid ${indicator.due_status === 'COMPLIANT' ? '#10b981' : indicator.due_status === 'OVERDUE' ? '#ef4444' : '#f59e0b'}`
                    }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Status</div>
                        {indicator.due_status}
                    </div>
                </div>

                <div style={{ marginTop: 32, padding: 20, background: '#f9fafb', borderRadius: 8 }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Requirements & Guidance</h3>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.5 }}>
                        {indicator.evidence_required_text || 'No specific requirements listed.'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 32 }}>
                {/* Compliance History Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Compliance History</h3>
                        {loadingRecs && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Loading...</span>}
                    </div>

                    {!user ? (
                        <div style={{ padding: 24, background: '#f3f4f6', borderRadius: 8, textAlign: 'center', color: '#6b7280' }}>
                            Please sign in to view compliance history.
                        </div>
                    ) : records.length === 0 ? (
                        <div style={{ padding: 40, border: '2px dashed #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af', marginBottom: 12 }}>No compliance records found.</div>
                            <Link to={`/compliance/new?indicator=${indicator.id}`} style={{ color: '#2563eb', fontWeight: 500 }}>
                                Add the first record &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {records.map(r => (
                                <div key={r.id} style={{
                                    padding: 16, border: '1px solid #e5e7eb', borderRadius: 8,
                                    background: r.is_revoked ? '#f9fafb' : 'white',
                                    opacity: r.is_revoked ? 0.7 : 1,
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {new Date(r.compliant_on).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </span>
                                            {r.is_revoked && (
                                                <span style={{
                                                    marginLeft: 12, padding: '2px 8px', background: '#fee2e2',
                                                    color: '#991b1b', borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold'
                                                }}>
                                                    REVOKED
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {!r.is_revoked && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/compliance/${r.id}/edit`)}
                                                        style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleRevoke(r.id)}
                                                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Revoke
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>
                                        Valid until: {r.valid_until ? new Date(r.valid_until).toLocaleDateString() : 'N/A'}
                                    </div>
                                    {r.notes && <div style={{ fontSize: '0.9rem', color: '#374151', paddingLeft: 12, borderLeft: '3px solid #e5e7eb' }}>{r.notes}</div>}
                                    {r.is_revoked && r.revoked_reason && (
                                        <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#b91c1c', fontStyle: 'italic' }}>
                                            Reason: {r.revoked_reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Evidence Items Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Evidence Items</h3>
                        {loadingEvs && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Loading...</span>}
                    </div>

                    {!user ? (
                        <div style={{ padding: 24, background: '#f3f4f6', borderRadius: 8, textAlign: 'center', color: '#6b7280' }}>
                            Please sign in to view evidence.
                        </div>
                    ) : evidence.length === 0 ? (
                        <div style={{ padding: 40, border: '2px dashed #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af', marginBottom: 12 }}>No evidence items found.</div>
                            <Link to={`/evidence/upload?indicator=${indicator.id}`} style={{ color: '#2563eb', fontWeight: 500 }}>
                                Upload evidence now &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {evidence.map(e => (
                                <div key={e.id} style={{
                                    padding: 16, border: '1px solid #e5e7eb', borderRadius: 8,
                                    background: 'white'
                                }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '1.5rem' }}>
                                            {e.type === 'FILE' ? '📄' : e.type === 'NOTE' ? '📝' : e.type === 'LINK' ? '🔗' : '🖼️'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ fontWeight: 500 }}>
                                                    {e.file ? (
                                                        <a href={getFileUrl(e.file)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                            {e.file.split('/').pop()}
                                                        </a>
                                                    ) : e.url ? (
                                                        <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                            {e.url}
                                                        </a>
                                                    ) : (
                                                        <span>Note</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        onClick={() => handleEditEvidence(e)}
                                                        style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        title="Edit note"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvidence(e.id)}
                                                        style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}
                                                        title="Delete evidence"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                                                Uploaded {new Date(e.created_at).toLocaleDateString()}
                                            </div>
                                            {e.note_text && (
                                                <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#4b5563', background: '#f9fafb', padding: 8, borderRadius: 4 }}>
                                                    {e.note_text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
