import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import LoadingSpinner from './LoadingSpinner';
import { ROLE_ADMIN } from '../app/Constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { auth, currentUser } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login with return path
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user data is not loaded yet, show loading
  if (!currentUser) {
    return <LoadingSpinner />;
  }

  // Check role-based access if requiredRole is specified; admin manages the whole workflow, so has every role's access
  if (requiredRole) {
    const hasRole = currentUser.authorities?.includes(requiredRole) || currentUser.authorities?.includes(ROLE_ADMIN);
    if (!hasRole) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

