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
import ImportIndicators from './pages/ImportIndicators';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/indicators/:id" element={<IndicatorDetail />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/compliance/new" element={<ComplianceForm />} />
              <Route path="/evidence/upload" element={<EvidenceUpload />} />
              <Route path="/indicators/import" element={<ImportIndicators />} />
              <Route path="/audit" element={<AuditDashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
