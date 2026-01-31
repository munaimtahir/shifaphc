import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) return <div>Loading auth...</div>;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    return <Outlet />;
}
