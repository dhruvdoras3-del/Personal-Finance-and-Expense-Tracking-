import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import SavingsGoals from './pages/SavingsGoals';
import Reminders from './pages/Reminders';
import AIInsights from './pages/AIInsights';
import InvestmentsLoans from './pages/InvestmentsLoans';
import BankIntegration from './pages/BankIntegration';
import Admin from './pages/Admin';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-dark-text font-bold text-sm">
        Initializing Secure Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is blocked
  if (user.role === 'blocked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-dark-text p-6">
        <div className="glass-panel p-8 max-w-md text-center border-brand-danger/30 space-y-4">
          <h2 className="text-xl font-bold text-brand-danger">Access Restricted</h2>
          <p className="text-xs text-dark-muted leading-relaxed">
            Your FinVibe user account has been blocked or suspended by an administrator. Please reach out to support for resolution.
          </p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="glass-btn-secondary text-xs w-full py-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Admin Protection Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Standard Panel Layout
const AppLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden relative">
      {/* Sidebar drawer */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar toggleSidebar={toggleSidebar} title={pageTitle} />
        
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Path */}
          <Route path="/login" element={<Login />} />

          {/* Protected Panel Paths */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Financial Dashboard">
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/transactions" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Transactions History">
                <Transactions />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/budgets" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Category Budgets">
                <Budgets />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/goals" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Savings Goals Tracker">
                <SavingsGoals />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/reminders" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Bill Reminders">
                <Reminders />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/ai" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Smart AI Wealth Coach">
                <AIInsights />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/wealth" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Investments & Debt Trackers">
                <InvestmentsLoans />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/bank-link" element={
            <ProtectedRoute>
              <AppLayout pageTitle="Linked Bank Accounts">
                <BankIntegration />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin Dashboard Protected Path */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <AppLayout pageTitle="Platform Administration">
                  <Admin />
                </AppLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
