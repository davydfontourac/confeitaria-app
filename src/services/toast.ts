import toast from 'react-hot-toast';

/**
 * Serviço centralizado para gerenciar notificações toast
 * Fornece uma interface consistente para feedback visual
 */

interface ToastMessages {
  recipe: {
    saved: string;
    updated: string;
    deleted: string;
    error: string;
    validation: string;
  };
  auth: {
    loginSuccess: string;
    logoutSuccess: string;
    registerSuccess: string;
    error: string;
  };
  general: {
    loading: string;
    success: string;
    error: string;
    networkError: string;
  };
}

const messages: ToastMessages = {
  recipe: {
    saved: '✅ Receita salva com sucesso!',
    updated: '✅ Receita atualizada com sucesso!',
    deleted: '🗑️ Receita excluída com sucesso!',
    error: '❌ Erro ao processar receita',
    validation: '⚠️ Verifique os campos obrigatórios',
  },
  auth: {
    loginSuccess: '👋 Bem-vindo de volta!',
    logoutSuccess: '👋 Até logo!',
    registerSuccess: '🎉 Conta criada com sucesso!',
    error: '❌ Erro de autenticação',
  },
  general: {
    loading: '⏳ Carregando...',
    success: '✅ Operação realizada com sucesso!',
    error: '❌ Algo deu errado',
    networkError: '🌐 Erro de conexão. Verifique sua internet.',
  },
};

/**
 * Serviços de toast para receitas
 */
export const recipeToast = {
  saved: () => toast.success(messages.recipe.saved),
  updated: () => toast.success(messages.recipe.updated),
  deleted: () => toast.success(messages.recipe.deleted),
  error: (error?: string) => toast.error(error || messages.recipe.error),
  validation: () => toast.error(messages.recipe.validation),

  saving: () => toast.loading('💾 Salvando receita...'),
  deleting: () => toast.loading('🗑️ Excluindo receita...'),
};

/**
 * Serviços de toast para autenticação
 */
export const authToast = {
  loginSuccess: () => toast.success(messages.auth.loginSuccess),
  logoutSuccess: () => toast.success(messages.auth.logoutSuccess),
  registerSuccess: () => toast.success(messages.auth.registerSuccess),
  error: (error?: string) => toast.error(error || messages.auth.error),

  loggingIn: () => toast.loading('🔐 Fazendo login...'),
  registering: () => toast.loading('📝 Criando conta...'),
};

/**
 * Serviços de toast gerais
 */
export const generalToast = {
  success: (message?: string) =>
    toast.success(message || messages.general.success),
  error: (message?: string) => toast.error(message || messages.general.error),
  loading: (message?: string) =>
    toast.loading(message || messages.general.loading),
  networkError: () => toast.error(messages.general.networkError),

  // Métodos utilitários
  dismiss: () => toast.dismiss(),
  dismissAll: () => toast.dismiss(),

  // Toast customizado com promise
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),
};

/**
 * Helper para tratar erros do Firebase e mostrar mensagens apropriadas
 */
export const handleFirebaseError = (error: unknown) => {
  console.error('Firebase Error:', error);

  let message = messages.general.error;

  // Type guard para verificar se o erro tem as propriedades do Firebase
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;

    switch (errorCode) {
      case 'auth/user-not-found':
        message = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Senha incorreta';
        break;
      case 'auth/email-already-in-use':
        message = 'Email já está em uso';
        break;
      case 'auth/weak-password':
        message = 'Senha muito fraca';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/network-request-failed':
        message = messages.general.networkError;
        break;
      case 'firestore/permission-denied':
        message =
          '🔒 Acesso negado ao Firestore. Possíveis causas:\n' +
          '• Usuário não autenticado\n' +
          '• Regras de segurança restritivas\n' +
          '• Token de autenticação expirado';
        break;
      case 'firestore/unavailable':
        message = '🔧 Firestore temporariamente indisponível. Tente novamente.';
        break;
      case 'permission-denied':
        message =
          '🔒 Erro de permissão. Verifique:\n' +
          '• Se você está logado\n' +
          '• Se as regras do Firestore estão corretas\n' +
          '• Se o projeto Firebase está ativo';
        break;
      default:
        if ('message' in error && typeof error.message === 'string') {
          message = error.message;
        }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  toast.error(message);
  return message;
};

/**
 * Toast para operações com loading automático
 */
export const toastWithLoading = async <T>(
  operation: () => Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<T> => {
  const toastId = toast.loading(messages.loading);

  try {
    const result = await operation();
    toast.success(messages.success, { id: toastId });
    return result;
  } catch (error) {
    const errorMessage = messages.error || 'Erro na operação';
    toast.error(errorMessage, { id: toastId });
    throw error;
  }
};

export default {
  recipe: recipeToast,
  auth: authToast,
  general: generalToast,
  handleFirebaseError,
  toastWithLoading,
};
