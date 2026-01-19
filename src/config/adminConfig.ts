// Define o email do admin
// ⚠️ MUDE PARA SEU EMAIL REAL
export const ADMIN_EMAILS = [
  'davydfontoura@gmail.com', // ← Mude para seu email aqui
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};
