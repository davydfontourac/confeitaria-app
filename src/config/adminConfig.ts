// Lista de emails autorizados como admin
export const ADMIN_EMAILS = ['davydfontoura@gmail.com'];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
