import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, CheckSquare, ShieldCheck } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navs = [
        { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
        { label: 'Indicators', path: '/indicators', icon: <List size={18} /> },
        { label: 'Tasks', path: '/tasks/today', icon: <CheckSquare size={18} /> },
        { label: 'Audit', path: '/audit', icon: <ShieldCheck size={18} /> },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ background: 'white', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container flex items-center justify-between" style={{ height: '3.5rem' }}>
                    <div className="flex items-center gap-4">
                        <div style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--color-primary)', marginRight: '2rem' }}>AccredOS</div>
                        <nav className="flex gap-2">
                            {navs.map(n => {
                                const active = location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path));
                                return (
                                    <Link
                                        key={n.path}
                                        to={n.path}
                                        className="flex items-center gap-2"
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 'var(--radius)',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            backgroundColor: active ? 'var(--color-neutral-bg)' : 'transparent',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        {n.icon} {n.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </header>
            <main className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
                {children}
            </main>
        </div>
    );
}
