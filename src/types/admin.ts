export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: Date;
}
