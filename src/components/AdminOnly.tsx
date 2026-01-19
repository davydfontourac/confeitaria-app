import React from 'react';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

<<<<<<< HEAD
=======
/**
 * Componente que renderiza conteúdo apenas para usuários admin
 * Se não for admin, renderiza o fallback ou nada
 */
>>>>>>> feature/admin-separation
const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const isAdmin = useIsAdmin();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
};

export default AdminOnly;
