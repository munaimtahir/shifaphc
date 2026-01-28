import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIndicator, fetchComplianceRecords, fetchEvidenceItems, Indicator, ComplianceRecord, EvidenceItem, getFileUrl } from '../api';
import { useAuth } from '../auth';

export default function IndicatorDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            fetchIndicator(id),
            // Only fetch records/evidence if user is likely to need them or if public read allowed? 
            // API requires Auth for records/evidence list? Let's check permissions.
            // Compliance/Evidence ViewSets are IsAuthenticated.
            // So if not authed, these fetches will fail/return 401.
            // We should check user status or catch errors gracefully.
            user ? fetchComplianceRecords(id) : Promise.resolve([]),
            user ? fetchEvidenceItems(id) : Promise.resolve([])
        ]).then(([ind, recs, evs]) => {
            setIndicator(ind);
            setRecords(recs);
            setEvidence(evs);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [id, user]);

    if (loading) return <div>Loading...</div>;
    if (!indicator) return <div>Indicator not found</div>;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, background: 'white', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>{indicator.indicator_text}</h1>
                        <div style={{ color: '#555', fontSize: '0.9em' }}>
                            <strong>Section:</strong> {indicator.section} | <strong>Standard:</strong> {indicator.standard} | <strong>Frequency:</strong> {indicator.frequency}
                        </div>
                    </div>
                    <div style={{
                        padding: "6px 12px", borderRadius: 4, fontWeight: 'bold',
                        backgroundColor: indicator.due_status === 'COMPLIANT' ? '#e6fffa' : indicator.due_status === 'OVERDUE' ? '#fff5f5' : '#fffbe6',
                        color: indicator.due_status === 'COMPLIANT' ? '#047857' : indicator.due_status === 'OVERDUE' ? '#c53030' : '#b7791f'
                    }}>
                        {indicator.due_status}
                    </div>
                </div>

                <div style={{ marginTop: 24 }}>
                    <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 8 }}>Requirements</h3>
                    {indicator.evidence_required_text && <p><strong>Evidence Required:</strong> {indicator.evidence_required_text}</p>}
                    {indicator.description && <p>{indicator.description}</p>}
                </div>

                {user && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <Link to={`/compliance/new?indicator=${indicator.id}`} style={{ padding: "8px 16px", backgroundColor: "#0066cc", color: "#fff", textDecoration: "none", borderRadius: 4 }}>
                            New Compliance Record
                        </Link>
                        <Link to={`/evidence/upload?indicator=${indicator.id}`} style={{ padding: "8px 16px", backgroundColor: "#fff", color: "#0066cc", border: "1px solid #0066cc", textDecoration: "none", borderRadius: 4 }}>
                            Add Evidence
                        </Link>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                    <h3>Compliance History</h3>
                    {!user ? <div style={{ color: '#666', fontStyle: 'italic' }}>Login to view history</div> :
                        records.length === 0 ? <div style={{ color: '#888' }}>No records found.</div> :
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {records.map(r => (
                                    <li key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{r.compliant_on}</strong>
                                            <span style={{ fontSize: '0.8em', color: '#666' }}>Valid until: {r.valid_until}</span>
                                        </div>
                                        {r.note && <div style={{ fontSize: '0.9em', color: '#444' }}>{r.note}</div>}
                                    </li>
                                ))}
                            </ul>
                    }
                </div>

                <div>
                    <h3>Evidence Items</h3>
                    {!user ? <div style={{ color: '#666', fontStyle: 'italic' }}>Login to list evidence</div> :
                        evidence.length === 0 ? <div style={{ color: '#888' }}>No evidence uploaded.</div> :
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {evidence.map(e => (
                                    <li key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {e.file ? (
                                                <a href={getFileUrl(e.file)} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                                                    {e.file.split('/').pop()}
                                                </a>
                                            ) : (
                                                <span>{e.link || 'Note'}</span>
                                            )}
                                            <span style={{ fontSize: '0.8em', color: '#888' }}>{new Date(e.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {e.note && <div style={{ fontSize: '0.9em', color: '#444' }}>{e.note}</div>}
                                    </li>
                                ))}
                            </ul>
                    }
                </div>
            </div>
        </div>
    );
}
