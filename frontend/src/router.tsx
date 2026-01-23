import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IndicatorsList } from './pages/IndicatorsList';
import { IndicatorDetail } from './pages/IndicatorDetail';
import { TasksToday } from './pages/TasksToday';
import { AuditMode } from './pages/AuditMode';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout><Dashboard /></Layout>,
    },
    {
        path: "/indicators",
        element: <Layout><IndicatorsList /></Layout>,
    },
    {
        path: "/indicators/:id",
        element: <Layout><IndicatorDetail /></Layout>,
    },
    {
        path: "/tasks/today",
        element: <Layout><TasksToday /></Layout>,
    },
    {
        path: "/audit",
        element: <Layout><AuditMode /></Layout>,
    },
]);
