import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook que verifica se o usuário tem o custom claim 'admin' no Firebase
 * Este é o único lugar onde o acesso real de admin é validado (com o claim do servidor)
 * Usado para operações sensíveis (testes, debug, funcionalidades administrativas)
 */
export const useHasAdminClaim = (): boolean => {
  const { currentUser } = useAuth();
  const [hasAdminClaim, setHasAdminClaim] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminClaim = async () => {
      if (!currentUser) {
        setHasAdminClaim(false);
        setIsChecking(false);
        return;
      }

      try {
        // Forçar refresh dos claims do token
        const token = await currentUser.getIdTokenResult(true);
        const isAdmin = token.claims.admin === true;
        setHasAdminClaim(isAdmin);
      } catch (error) {
        console.error('Erro ao verificar admin claim:', error);
        setHasAdminClaim(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminClaim();
  }, [currentUser]);

  return hasAdminClaim && !isChecking;
};
