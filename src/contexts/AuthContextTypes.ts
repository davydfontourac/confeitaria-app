import { createContext } from 'react';
import type { User } from 'firebase/auth';

// Tipos TypeScript
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Criar o contexto
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
