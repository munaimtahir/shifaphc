import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/dashboard";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (e: any) {
            setError(e.message || "Login failed");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", padding: 24, border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0 }}>Login</h2>
            {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label>
                    Username
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} required />
                </label>
                <label>
                    Password
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} required />
                </label>
                <button type="submit" style={{ padding: "10px", backgroundColor: "#0066cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>Sign In</button>
            </form>
        </div>
    );
}
