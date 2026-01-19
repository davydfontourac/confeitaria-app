// Configuração de admin via variáveis de ambiente (não versionadas)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

// Verifica se o usuário é admin com base em email e/ou UID
export const isAdminEmail = (email?: string | null, uid?: string | null): boolean => {
  if (!email) return false;
  const emailMatch = ADMIN_EMAIL ? email.toLowerCase() === ADMIN_EMAIL : false;
  const uidMatch = ADMIN_UID ? (uid || '') === ADMIN_UID : false;
  // Se UID estiver configurado, ele prevalece; caso contrário, valida pelo email
  return ADMIN_UID ? uidMatch : emailMatch;
};
