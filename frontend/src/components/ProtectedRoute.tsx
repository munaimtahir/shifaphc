import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export default function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div>Loading auth...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}
