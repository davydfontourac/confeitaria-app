import React, { createContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';

// Tipos TypeScript
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exportar o contexto para uso no hook separado
export { AuthContext };

// Provider do contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função de login
  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Login com Google (também cria conta se não existir)
  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);

    // Atualizar estado local com informações que vêm do Google
    setCurrentUser(result.user);
  };

  // Função de registro
  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Atualizar o perfil do usuário com o nome
    await updateProfile(user, {
      displayName: name,
    });

    // Forçar atualização do estado local
    setCurrentUser({ ...user, displayName: name });
  };

  // Função de logout
  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  // Função de reset de senha
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Escutar mudanças no estado de autenticação
  useEffect(() => {
    console.log('🔐 Iniciando listener de autenticação...');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuário autenticado:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        });
      } else {
        console.log('❌ Nenhum usuário autenticado');
      }

      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
