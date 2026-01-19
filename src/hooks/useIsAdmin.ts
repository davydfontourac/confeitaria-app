import { useAuth } from './useAuth';
import { isAdminEmail } from '../config/adminConfig';

export const useIsAdmin = (): boolean => {
  const { currentUser } = useAuth();
  return currentUser ? isAdminEmail(currentUser.email || '', currentUser.uid) : false;
};
