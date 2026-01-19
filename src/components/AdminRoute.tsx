<<<<<<< HEAD
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './LoadingSpinner';
=======
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminEmail } from '../config/adminConfig';
>>>>>>> feature/admin-separation

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
<<<<<<< HEAD
  const isAdmin = useIsAdmin();

  if (loading) {
    return <LoadingSpinner />;
=======

  if (loading) {
    return <div>Carregando...</div>;
>>>>>>> feature/admin-separation
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

<<<<<<< HEAD
  if (!isAdmin) {
=======
  if (!isAdminEmail(currentUser.email || '')) {
>>>>>>> feature/admin-separation
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
