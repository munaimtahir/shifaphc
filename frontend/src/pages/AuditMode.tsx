import React, { useState } from 'react';
import { api } from '../api/client';
import { AuditSummary, Indicator } from '../types';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Link } from 'react-router-dom';

export function AuditMode() {
    const [period, setPeriod] = useState('Month');
    const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState<AuditSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const runAudit = () => {
        setLoading(true);
        api.get<AuditSummary>(`/api/audit/summary/`, { period, start })
            .then(setSummary)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Audit Mode</h1>

            <Card title="Audit configuration">
                <div className="flex items-end gap-4 p-4" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label className="block text-sm font-medium mb-1">Period</label>
                        <select className="select" value={period} onChange={e => setPeriod(e.target.value)}>
                            <option value="Month">Month</option>
                            <option value="Quarter">Quarter</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <button className="btn" onClick={runAudit} disabled={loading}>
                        {loading ? 'Running...' : 'Run Audit'}
                    </button>
                </div>
            </Card>

            {summary && (
                <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="grid grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div className="card p-4 text-center">
                            <div className="text-sm text-muted" style={{ color: 'var(--color-text-muted)' }}>Compliant</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{summary.counts.COMPLIANT}</div>
                        </div>
                        <div className="card p-4 text-center">
                            <div className="text-sm text-muted" style={{ color: 'var(--color-text-muted)' }}>Due Soon</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{summary.counts.DUE_SOON}</div>
                        </div>
                        <div className="card p-4 text-center">
                            <div className="text-sm text-muted" style={{ color: 'var(--color-text-muted)' }}>Overdue</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{summary.counts.OVERDUE}</div>
                        </div>
                        <div className="card p-4 text-center">
                            <div className="text-sm text-muted" style={{ color: 'var(--color-text-muted)' }}>Not Started</div>
                            <div className="text-2xl font-bold" style={{ color: 'var(--color-neutral-text)' }}>{summary.counts.NOT_STARTED}</div>
                        </div>
                    </div>

                    <Card title="Gap List (Top 25)">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Indicator</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.gap_list && summary.gap_list.map(i => (
                                    <tr key={i.id}>
                                        <td>{i.indicator_text}</td>
                                        <td><StatusBadge status={i.due_status} /></td>
                                        <td><Link to={`/indicators/${i.id}`} style={{ color: 'var(--color-primary)' }}>Fix</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <div className="flex justify-end p-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" disabled title="Not available in Release 1.1">Export Pack</button>
                    </div>
                </div>
            )}
        </div>
    );
}
