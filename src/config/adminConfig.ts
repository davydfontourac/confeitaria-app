<<<<<<< HEAD
// Configuração de admin via variáveis de ambiente (não versionadas)
// Nota: VITE_ADMIN_EMAIL é exposto ao cliente para UX (email é público anyway)
// Autorização real é feita no Firestore via custom claim 'admin' (servidor)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

// Verifica se o usuário tem o email de admin (apenas para UX, não para autorização)
export const isAdminEmail = (email?: string | null): boolean => {
  if (!email || !ADMIN_EMAIL) return false;
  return email.toLowerCase() === ADMIN_EMAIL;
=======
// Define o email do admin
// ⚠️ MUDE PARA SEU EMAIL REAL
export const ADMIN_EMAILS = [
  'davydfontoura@gmail.com', // ← Mude para seu email aqui
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
>>>>>>> feature/admin-separation
};
