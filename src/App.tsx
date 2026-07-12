/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Forecast from './pages/Forecast';
import Goals from './pages/Goals';
import Advisor from './pages/Advisor';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AuthenticatedApp() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user && !isGuest) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
