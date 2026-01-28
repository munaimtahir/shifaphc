import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            padding: '12px 24px',
                            borderRadius: 8,
                            backgroundColor: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#dc2626' : '#2563eb',
                            color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            minWidth: 200,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            animation: 'slideIn 0.3s ease-out forwards',
                        }}
                    >
                        {toast.message}
                    </div>
                ))}
                <style>
                    {`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}
                </style>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
