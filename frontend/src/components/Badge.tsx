import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {label}
        </span>
    );
}

export function StatusBadge({ status }: { status: string }) {
    let variant: BadgeVariant = 'neutral';
    let label = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

    switch (status) {
        case 'COMPLIANT': variant = 'success'; break;
        case 'DUE_SOON': variant = 'warning'; break;
        case 'OVERDUE': variant = 'danger'; break;
        case 'NOT_STARTED': variant = 'neutral'; break;
    }

    return <Badge label={label} variant={variant} />;
}
