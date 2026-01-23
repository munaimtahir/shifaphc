import React from 'react';

export function Card({ children, className = '', title, actions }: { children: React.ReactNode, className?: string, title?: string, actions?: React.ReactNode }) {
    return (
        <div className={`card ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200" style={{ borderColor: 'var(--color-border)' }}>
                    {title && <h3 className="font-bold text-lg m-0">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
