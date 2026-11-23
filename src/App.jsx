import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QrFormPage from './pages/QrFormPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QrFormPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
