import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Indicator } from '../types';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function Dashboard() {
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Indicator[]>('/api/indicators/')
            .then(setIndicators)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const counts = {
        COMPLIANT: indicators.filter(i => i.due_status === 'COMPLIANT').length,
        DUE_SOON: indicators.filter(i => i.due_status === 'DUE_SOON').length,
        OVERDUE: indicators.filter(i => i.due_status === 'OVERDUE').length,
        NOT_STARTED: indicators.filter(i => i.due_status === 'NOT_STARTED').length,
    };

    const overdue = indicators.filter(i => i.due_status === 'OVERDUE').slice(0, 10);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard label="Compliant" count={counts.COMPLIANT} color="success" icon={<CheckCircle />} />
                <StatCard label="Due Soon" count={counts.DUE_SOON} color="warning" icon={<Clock />} />
                <StatCard label="Overdue" count={counts.OVERDUE} color="danger" icon={<AlertCircle />} />
                <StatCard label="Not Started" count={counts.NOT_STARTED} color="neutral" icon={<div />} />
            </div>

            <div className="flex gap-4 mt-4">
                <Link to="/tasks/today" className="btn">Go to Today's Tasks</Link>
                <Link to="/indicators" className="btn btn-secondary">Browse Indicators</Link>
                <Link to="/audit" className="btn btn-secondary">Audit Mode</Link>
            </div>

            <div className="mt-4">
                <Card title="Overdue Items (Top 10)">
                    {overdue.length === 0 ? (
                        <div className="text-muted p-4">No overdue items! Great job.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Section</th>
                                    <th>Indicator</th>
                                    <th>Frequency</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdue.map(i => (
                                    <tr key={i.id}>
                                        <td>{i.section}</td>
                                        <td>{i.indicator_text.substring(0, 60)}...</td>
                                        <td style={{ textTransform: 'lowercase' }}>{i.frequency}</td>
                                        <td>
                                            <Link to={`/indicators/${i.id}`} className="text-sm font-medium">Fix</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </div>
    );
}

function StatCard({ label, count, color, icon }: any) {
    const mapColor: any = {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        neutral: 'var(--color-neutral)',
    };
    return (
        <div className="card p-4 flex items-center justify-between">
            <div>
                <div className="text-muted text-sm font-medium uppercase">{label}</div>
                <div className="text-2xl font-bold" style={{ color: mapColor[color] }}>{count}</div>
            </div>
            <div style={{ color: mapColor[color], opacity: 0.8 }}>{icon}</div>
        </div>
    )
}
