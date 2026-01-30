import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import IndicatorDetail from './pages/IndicatorDetail';
import ComplianceForm from './pages/ComplianceForm';
import EvidenceUpload from './pages/EvidenceUpload';
import AuditDashboard from './pages/AuditDashboard';
import AuditLogs from './pages/AuditLogs';
import AuditSnapshot from './pages/AuditSnapshot';
import ImportIndicators from './pages/ImportIndicators';
import IndicatorForm from './pages/IndicatorForm';
import ProjectsListPage from './pages/ProjectsListPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/indicators/:id" element={<IndicatorDetail />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/projects" element={<ProjectsListPage />} />
                <Route path="/projects/new" element={<CreateProjectPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/compliance/new" element={<ComplianceForm />} />
                <Route path="/compliance/:id/edit" element={<ComplianceForm />} />
                <Route path="/evidence/upload" element={<EvidenceUpload />} />
                <Route path="/indicators/import" element={<ImportIndicators />} />
                <Route path="/indicators/new" element={<IndicatorForm />} />
                <Route path="/indicators/:id/edit" element={<IndicatorForm />} />
                <Route path="/audit" element={<AuditDashboard />} />
                <Route path="/audit/logs" element={<AuditLogs />} />
                <Route path="/audit/snapshot" element={<AuditSnapshot />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
