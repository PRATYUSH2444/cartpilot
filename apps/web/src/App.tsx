import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionEndedModal } from './components/SessionEndedModal';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { BecomeMerchantPage } from './pages/auth/BecomeMerchantPage';
import { AcceptStaffInvitePage } from './pages/auth/AcceptStaffInvitePage';
import { AccountSecurityPage } from './pages/auth/AccountSecurityPage';
import { ShopperWorkspace } from './pages/shopper/ShopperWorkspace';
import { MerchantWorkspace } from './pages/merchant/MerchantWorkspace';
import { AdminWorkspace } from './pages/admin/AdminWorkspace';

// Root smart redirect based on session status and server-assigned role
const RootRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'MERCHANT') {
    return <Navigate to="/merchant" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/shopper" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Session expiry re-auth dialog */}
        <SessionEndedModal />

        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/become-merchant" element={<BecomeMerchantPage />} />
          <Route path="/accept-invite" element={<AcceptStaffInvitePage />} />

          {/* Account Security (All authenticated roles) */}
          <Route
            path="/account-security"
            element={
              <ProtectedRoute>
                <AccountSecurityPage />
              </ProtectedRoute>
            }
          />

          {/* Role-Specific Workspaces */}
          <Route
            path="/shopper"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <ShopperWorkspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={['MERCHANT']}>
                <MerchantWorkspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWorkspace />
              </ProtectedRoute>
            }
          />

          {/* Root & Fallback Redirection */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
