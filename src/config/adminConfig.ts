// Lista de emails autorizados como admin
export const ADMIN_EMAILS = [
  'seu-email-admin@gmail.com', // substitua pelo(s) email(s) de admin
];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
