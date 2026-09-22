import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-neutral-200)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-neutral-600)',
        }}>
          Loading showroom session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && role !== 'admin') {
    // Staff attempted to visit admin-only section: redirect to sales billing
    return <Navigate to="/sales" replace />;
  }

  return <>{children}</>;
};
