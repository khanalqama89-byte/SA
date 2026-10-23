import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Tools from '../pages/Tools';
import ToolDetailPage from '../pages/ToolDetailPage';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import Contact from '../pages/Contact';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tools" element={<Tools />} />

      {/* AdSense Compliance Pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/terms-of-service" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

      {/* Redirect removed auth routes directly to home */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      {/* Dedicated Tool Detail Pages */}
      <Route path="/:slug" element={<ToolDetailPage />} />
      <Route path="/tool/:slug" element={<ToolDetailPage />} />
      <Route path="/tools/:slug" element={<ToolDetailPage />} />
      <Route path="/convert/:slug" element={<ToolDetailPage />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
