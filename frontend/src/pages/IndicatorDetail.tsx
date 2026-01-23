import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Indicator, ComplianceRecord, EvidenceItem } from '../types';
import { Card } from '../components/Card';
import { Badge, StatusBadge } from '../components/Badge';
import { Field } from '../components/Field';
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react';

export function IndicatorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [history, setHistory] = useState<ComplianceRecord[]>([]);
    const [evidences, setEvidences] = useState<EvidenceItem[]>([]);

    // Edit State
    const [editData, setEditData] = useState<Partial<Indicator>>({});

    // Compliance State
    const [compNote, setCompNote] = useState('');
    const [compDate, setCompDate] = useState(new Date().toISOString().split('T')[0]);

    // Evidence State
    const [evidenceType, setEvidenceType] = useState('NOTE'); // NOTE, LINK, FILE...
    const [evidenceNote, setEvidenceNote] = useState('');
    const [evidenceLink, setEvidenceLink] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const loadData = async () => {
        if (!id) return;
        try {
            const ind = await api.get<Indicator>(`/api/indicators/${id}/`);
            setIndicator(ind);
            setEditData({
                frequency: ind.frequency,
                responsible_person: ind.responsible_person || '',
                ai_prompt_template: ind.ai_prompt_template || '',
                evidence_min_rule_json: ind.evidence_min_rule_json || {}
            });

            // Try fetch history
            const hist = await api.get<any>(`/api/compliance/?indicator=${id}`);
            const histData = Array.isArray(hist) ? hist : (hist.results || []);
            setHistory(histData.slice(0, 10)); // Last 10

            // Try fetch evidence
            const ev = await api.get<any>(`/api/evidence/?indicator=${id}`);
            const evData = Array.isArray(ev) ? ev : (ev.results || []);
            setEvidences(evData);

        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    const handleSaveEdit = async () => {
        if (!indicator) return;
        await api.patch(`/api/indicators/${indicator.id}/`, editData);
        loadData();
        alert('Changes saved');
    };

    const handleCompliance = async () => {
        if (!indicator) return;
        try {
            await api.post('/api/compliance/', {
                indicator: indicator.id,
                compliant_on: compDate,
                notes: compNote
            });
            setCompNote('');
            loadData();
        } catch (e) {
            alert('Error saving compliance');
        }
    };

    const handleEvidence = async () => {
        if (!indicator) return;
        const formData = new FormData();
        formData.append('indicator', indicator.id);
        formData.append('evidence_type', evidenceType);

        if (evidenceType === 'NOTE') formData.append('note_text', evidenceNote);
        else if (evidenceType === 'LINK') formData.append('link_url', evidenceLink);
        else if (['FILE', 'PHOTO', 'SCREENSHOT'].includes(evidenceType) && evidenceFile) {
            formData.append('file', evidenceFile);
        }

        try {
            await api.post('/api/evidence/', formData, true);
            setEvidenceNote('');
            setEvidenceLink('');
            setEvidenceFile(null);
            loadData();
        } catch (e) {
            alert('Error uploading evidence');
        }
    };

    if (!indicator) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted mb-2 hover:text-primary" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{indicator.section}</span>
                            <span className="text-muted text-sm">•</span>
                            <span className="text-sm text-muted">{indicator.standard}</span>
                        </div>
                        <h1 className="text-xl font-bold max-w-3xl m-0">{indicator.indicator_text}</h1>
                    </div>
                    <StatusBadge status={indicator.due_status} />
                </div>
                <div className="flex gap-4 mt-4 text-sm bg-slate-50 p-3 rounded border border-slate-200" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div>Last Compliant: <strong>{indicator.last_compliant_date || 'Never'}</strong></div>
                    <div>Next Due: <strong>{indicator.next_due_date || '-'}</strong></div>
                </div>
            </div>

            {/* Quick Edit */}
            <Card title="Configuration">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="Frequency">
                        <select
                            className="select"
                            value={editData.frequency}
                            onChange={e => setEditData({ ...editData, frequency: e.target.value })}
                        >
                            {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'ADHOC'].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </Field>
                    <Field label="Responsible Person">
                        <input
                            className="input"
                            value={editData.responsible_person || ''}
                            onChange={e => setEditData({ ...editData, responsible_person: e.target.value })}
                        />
                    </Field>
                    <div style={{ gridColumn: 'span 2' }}>
                        <Field label="AI Prompt Template">
                            <textarea
                                className="textarea"
                                rows={2}
                                value={editData.ai_prompt_template || ''}
                                onChange={e => setEditData({ ...editData, ai_prompt_template: e.target.value })}
                            />
                        </Field>
                    </div>
                </div>
                <div className="mt-4 flex justify-end" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={handleSaveEdit}>Save Changes</button>
                </div>
            </Card>

            {/* Action Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                {/* Mark Compliant */}
                <Card title="Mark Compliant">
                    <Field label="Compliant On">
                        <input type="date" className="input" value={compDate} onChange={e => setCompDate(e.target.value)} />
                    </Field>
                    <Field label="Notes">
                        <textarea className="textarea" rows={3} value={compNote} onChange={e => setCompNote(e.target.value)} placeholder="Describe compliance..." />
                    </Field>
                    <button className="btn w-full mt-2" style={{ width: '100%' }} onClick={handleCompliance}>
                        <CheckCircle className="mr-2" size={16} />
                        Save Compliance Record
                    </button>
                </Card>

                {/* Evidence */}
                <Card title="Add Evidence">
                    <div className="flex gap-2 mb-4">
                        {['NOTE', 'LINK', 'FILE'].map(t => (
                            <button
                                key={t}
                                className="px-3 py-1 rounded text-sm border"
                                style={{
                                    borderColor: evidenceType === t ? 'var(--color-primary)' : 'var(--color-border)',
                                    color: evidenceType === t ? 'var(--color-primary)' : 'var(--color-text)',
                                    background: evidenceType === t ? 'var(--color-neutral-bg)' : 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setEvidenceType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {evidenceType === 'NOTE' && (
                        <Field label="Note">
                            <textarea className="textarea" rows={3} value={evidenceNote} onChange={e => setEvidenceNote(e.target.value)} />
                        </Field>
                    )}
                    {evidenceType === 'LINK' && (
                        <Field label="URL">
                            <input className="input" value={evidenceLink} onChange={e => setEvidenceLink(e.target.value)} />
                        </Field>
                    )}
                    {(evidenceType === 'FILE' || evidenceType === 'PHOTO' || evidenceType === 'SCREENSHOT') && (
                        <Field label="File">
                            <input type="file" className="input" onChange={e => setEvidenceFile(e.target.files ? e.target.files[0] : null)} />
                        </Field>
                    )}

                    <button className="btn btn-secondary w-full mt-2" style={{ width: '100%' }} onClick={handleEvidence}>
                        <Upload className="mr-2" size={16} />
                        Upload Evidence
                    </button>

                    {/* Evidence List */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold mb-2">Recent Evidence</h4>
                        <div className="flex flex-col gap-2">
                            {evidences.slice(0, 5).map(e => (
                                <div key={e.id} className="text-sm p-2 bg-slate-50 rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                                    <div className="font-medium text-xs text-muted">{e.evidence_type} • {e.created_at?.split('T')[0]}</div>
                                    {e.note_text && <div>{e.note_text}</div>}
                                    {e.link_url && <a href={e.link_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate block">{e.link_url}</a>}
                                    {e.file && <a href={e.file} target="_blank" rel="noreferrer" className="text-blue-600 underline">View File</a>}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Timeline */}
            <Card title="Compliance History">
                {history.length === 0 ? <div className="text-muted">No history yet.</div> : (
                    <div className="flex flex-col gap-4">
                        {history.map(h => (
                            <div key={h.id} style={{ borderLeft: '2px solid var(--color-primary-bg)', paddingLeft: '1rem' }}>
                                <div className="text-sm font-bold">{h.compliant_on}</div>
                                <div className="text-sm">{h.notes}</div>
                                <div className="text-xs text-muted mt-1">Valid until: {h.valid_until} • Evidence: {h.evidence_count || 0}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
