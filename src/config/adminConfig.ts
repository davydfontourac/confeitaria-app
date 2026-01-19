
// Configuração de admin via variáveis de ambiente (não versionadas)
// Nota: VITE_ADMIN_EMAIL é exposto ao cliente para UX (email é público anyway)
// Autorização real é feita no Firestore via custom claim 'admin' (servidor)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

// Verifica se o usuário tem o email de admin (apenas para UX, não para autorização)
export const isAdminEmail = (email?: string | null): boolean => {
  if (!email || !ADMIN_EMAIL) return false;
  return email.toLowerCase() === ADMIN_EMAIL};
