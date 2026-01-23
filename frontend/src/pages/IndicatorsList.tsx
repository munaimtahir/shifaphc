import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Indicator } from '../types';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Search } from 'lucide-react';

export function IndicatorsList() {
    const navigate = useNavigate();
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [q, setQ] = useState('');
    const [filters, setFilters] = useState({
        frequency: '',
        due_status: '',
        section: '',
        is_active: 'true'
    });

    useEffect(() => {
        api.get<Indicator[]>('/api/indicators/')
            .then(setIndicators)
            .catch(console.error);
    }, []);

    const sections = useMemo(() => Array.from(new Set(indicators.map(i => i.section))).sort(), [indicators]);

    const filtered = indicators.filter(i => {
        if (q && !i.indicator_text.toLowerCase().includes(q.toLowerCase()) && !i.section.toLowerCase().includes(q.toLowerCase())) return false;
        if (filters.frequency && i.frequency !== filters.frequency) return false;
        if (filters.due_status && i.due_status !== filters.due_status) return false;
        if (filters.section && i.section !== filters.section) return false;
        if (filters.is_active === 'true' && !i.is_active) return false;
        if (filters.is_active === 'false' && i.is_active) return false;
        return true;
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Indicators</h1>
                <div className="text-sm text-muted">{filtered.length} items</div>
            </div>

            <Card>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={16} />
                            </div>
                            <input
                                className="input pl-10"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Search indicators..."
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <select className="select" style={{ width: 'auto' }} value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })}>
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="select" style={{ width: 'auto' }} value={filters.frequency} onChange={e => setFilters({ ...filters, frequency: e.target.value })}>
                            <option value="">All Frequencies</option>
                            {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'ADHOC'].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select className="select" style={{ width: 'auto' }} value={filters.due_status} onChange={e => setFilters({ ...filters, due_status: e.target.value })}>
                            <option value="">All Statuses</option>
                            {['COMPLIANT', 'DUE_SOON', 'OVERDUE', 'NOT_STARTED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <select className="select" style={{ width: 'auto' }} value={filters.is_active} onChange={e => setFilters({ ...filters, is_active: e.target.value })}>
                            <option value="all">All Active/Inactive</option>
                            <option value="true">Active Only</option>
                            <option value="false">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden p-0" style={{ padding: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>Section</th>
                            <th style={{ width: '10%' }}>Standard</th>
                            <th>Indicator</th>
                            <th style={{ width: '10%' }}>Freq</th>
                            <th style={{ width: '12%' }}>Status</th>
                            <th style={{ width: '12%' }}>Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(i => (
                            <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/indicators/${i.id}`)}>
                                <td className="text-sm font-medium">{i.section}</td>
                                <td className="text-sm text-muted">{i.standard}</td>
                                <td>{i.indicator_text.length > 80 ? i.indicator_text.substring(0, 80) + '...' : i.indicator_text}</td>
                                <td className="text-sm" style={{ textTransform: 'lowercase' }}>{i.frequency}</td>
                                <td><StatusBadge status={i.due_status} /></td>
                                <td className="text-sm">{i.next_due_date || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="p-8 text-center text-muted">No indicators found.</div>}
            </Card>
        </div>
    );
}
