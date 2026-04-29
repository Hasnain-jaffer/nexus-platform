import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
  /**
   * When true, redirect authenticated users to their dashboard.
   * Used on Login / Register / ForgotPassword pages so a logged-in
   * user who navigates to /login doesn't see the login form again.
   */
  redirectIfAuthenticated?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ redirectIfAuthenticated = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Wait for auth state to resolve before making a redirect decision
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  // FIX: Authenticated users trying to reach /login or /register are
  // redirected to their role-specific dashboard instead of seeing the form.
  if (redirectIfAuthenticated && isAuthenticated && user) {
    const dashboardRoute =
      user.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor';
    return <Navigate to={dashboardRoute} replace />;
  }

  return <Outlet />;
};
