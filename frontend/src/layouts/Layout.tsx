import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <div style={{ fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto", padding: 16 }}>
            <nav style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #eee", marginBottom: 24, alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: 20, fontWeight: "bold", textDecoration: "none", color: "#333", marginRight: "auto" }}>AccredOS</Link>
                <Link to="/" style={{ textDecoration: 'none', color: '#0066cc' }}>Dashboard</Link>
                {user && <Link to="/audit" style={{ textDecoration: 'none', color: '#0066cc' }}>Audit</Link>}
                {user && <Link to="/indicators/import" style={{ textDecoration: 'none', color: '#0066cc' }}>Import</Link>}
                {user ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ color: '#888' }}>{user.username}</span>
                        <button onClick={handleLogout} style={{ padding: "6px 12px", cursor: "pointer", border: "1px solid #ddd", background: "#fff", borderRadius: 4 }}>Logout</button>
                    </div>
                ) : (
                    <Link to="/login" style={{ textDecoration: 'none', color: '#0066cc' }}>Login</Link>
                )}
            </nav>
            <Outlet />
        </div>
    );
}
