import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Indicator } from '../types';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { useNavigate } from 'react-router-dom';

export function TasksToday() {
    const navigate = useNavigate();
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [tab, setTab] = useState('OVERDUE');

    // Quick Mark Compliant Modal
    const [selectedInd, setSelectedInd] = useState<Indicator | null>(null);
    const [compNote, setCompNote] = useState('');
    const [compDate, setCompDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        api.get<Indicator[]>('/api/indicators/').then(setIndicators);
    }, []);

    const filtered = indicators.filter(i => i.due_status === tab);

    const handleQuickCompliance = async () => {
        if (!selectedInd) return;
        await api.post('/api/compliance/', {
            indicator: selectedInd.id,
            compliant_on: compDate,
            notes: compNote
        });
        setSelectedInd(null);
        setCompNote('');
        // Refresh list simple way
        api.get<Indicator[]>('/api/indicators/').then(setIndicators);
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Today's Tasks</h1>
            <div className="flex gap-4 border-b mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['OVERDUE', 'DUE_SOON', 'NOT_STARTED'].map(t => (
                    <button
                        key={t}
                        className="pb-2 px-1 font-medium"
                        style={{
                            border: 'none',
                            background: 'none',
                            borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.5rem 1rem',
                            marginBottom: '-1px'
                        }}
                        onClick={() => setTab(t)}
                    >
                        {t.replace('_', ' ')} ({indicators.filter(i => i.due_status === t).length})
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {filtered.map(i => (
                    <Card key={i.id} className="flex flex-col justify-between h-full">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-bold text-muted" style={{ color: 'var(--color-text-muted)' }}>{i.section}</div>
                                <div className="text-xs px-2 py-0.5 rounded bg-gray-100" style={{ backgroundColor: 'var(--color-neutral-bg)' }}>{i.frequency}</div>
                            </div>
                            <div className="font-medium mb-4">{i.indicator_text}</div>
                        </div>
                        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <button className="btn btn-secondary btn-sm flex-1" style={{ width: '50%' }} onClick={() => navigate(`/indicators/${i.id}`)}>Open</button>
                            <button className="btn btn-sm flex-1" style={{ width: '50%' }} onClick={() => setSelectedInd(i)}>Mark Compliant</button>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <div className="col-span-full text-muted p-8 text-center" style={{ gridColumn: '1 / -1' }}>No tasks in this category.</div>}
            </div>

            <Modal isOpen={!!selectedInd} onClose={() => setSelectedInd(null)} title="Quick Compliance">
                <Field label="Compliant On">
                    <input type="date" className="input" value={compDate} onChange={e => setCompDate(e.target.value)} />
                </Field>
                <Field label="Notes">
                    <textarea className="textarea" rows={3} value={compNote} onChange={e => setCompNote(e.target.value)} />
                </Field>
                <div className="flex justify-end mt-4" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={handleQuickCompliance}>Save</button>
                </div>
            </Modal>
        </div>
    );
}
