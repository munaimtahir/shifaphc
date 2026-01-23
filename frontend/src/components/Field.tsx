import React from 'react';

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
            {children}
            {error && <div className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{error}</div>}
        </div>
    );
}
