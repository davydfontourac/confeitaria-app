import toast from 'react-hot-toast';

/**
 * Sistema simplificado de tratamento de erros
 * Fornece mensagens amigáveis para diferentes tipos de erro
 */

export type ErrorType =
  | 'network'
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'firestore'
  | 'unknown';

// Interface para erro estruturado
export interface AppError {
  type: ErrorType;
  code?: string;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
}

// Mensagens de erro amigáveis
const ERROR_MESSAGES = {
  network: {
    'network-request-failed':
      'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
    'network-timeout':
      'A operação demorou muito para responder. Tente novamente.',
    offline:
      'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
    default: 'Erro de conexão. Verifique sua internet e tente novamente.',
  },
  authentication: {
    'auth/user-not-found':
      'Email não encontrado. Verifique o endereço digitado.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/too-many-requests':
      'Muitas tentativas de login. Tente novamente em alguns minutos.',
    'auth/user-disabled':
      'Esta conta foi desabilitada. Entre em contato com o suporte.',
    'auth/email-already-in-use':
      'Este email já está em uso. Tente fazer login ou use outro email.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/invalid-email': 'Email inválido. Verifique o formato do endereço.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    default: 'Erro de autenticação. Tente fazer login novamente.',
  },
  permission: {
    'permission-denied': 'Você não tem permissão para realizar esta ação.',
    'missing-or-insufficient-permissions':
      'Permissões insuficientes. Faça login novamente.',
    unauthenticated: 'Você precisa estar logado para continuar.',
    default: 'Erro de permissão. Verifique se você está logado.',
  },
  validation: {
    'invalid-data': 'Dados inválidos. Verifique os campos preenchidos.',
    'required-field': 'Campos obrigatórios não foram preenchidos.',
    'invalid-format': 'Formato inválido. Verifique os dados digitados.',
    'out-of-range': 'Valor fora do intervalo permitido.',
    default: 'Dados inválidos. Verifique os campos e tente novamente.',
  },
  firestore: {
    cancelled: 'Operação cancelada pelo usuário.',
    unknown: 'Erro interno do servidor. Tente novamente.',
    'invalid-argument': 'Dados inválidos enviados para o servidor.',
    'deadline-exceeded': 'Operação demorou muito. Tente novamente.',
    'not-found': 'Dados não encontrados.',
    'already-exists': 'Este item já existe.',
    'resource-exhausted': 'Limite de uso excedido. Tente novamente mais tarde.',
    'failed-precondition': 'Condições necessárias não foram atendidas.',
    aborted: 'Operação foi interrompida. Tente novamente.',
    'out-of-range': 'Valor fora do intervalo permitido.',
    unimplemented: 'Funcionalidade não implementada.',
    internal: 'Erro interno do servidor.',
    unavailable: 'Serviço temporariamente indisponível. Tente novamente.',
    'data-loss': 'Perda de dados detectada.',
    default: 'Erro no servidor. Tente novamente em alguns minutos.',
  },
  unknown: {
    default: 'Ops! Algo deu errado. Tente novamente.',
  },
};

/**
 * Identifica o tipo de erro baseado na mensagem/código
 */
export function identifyErrorType(error: unknown): ErrorType {
  const errorObj = error as { message?: string; code?: string };
  const errorMessage = errorObj?.message?.toLowerCase() || '';
  const errorCode = errorObj?.code?.toLowerCase() || '';

  // Erros de autenticação
  if (errorCode.startsWith('auth/') || errorMessage.includes('auth')) {
    return 'authentication';
  }

  // Erros de permissão
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('insufficient') ||
    errorMessage.includes('unauthenticated') ||
    errorCode === 'permission-denied'
  ) {
    return 'permission';
  }

  // Erros de rede
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline')
  ) {
    return 'network';
  }

  // Erros do Firestore
  if (
    errorCode.includes('firestore') ||
    [
      'cancelled',
      'unknown',
      'invalid-argument',
      'deadline-exceeded',
      'not-found',
      'already-exists',
      'resource-exhausted',
      'failed-precondition',
      'aborted',
      'out-of-range',
      'unimplemented',
      'internal',
      'unavailable',
      'data-loss',
    ].includes(errorCode)
  ) {
    return 'firestore';
  }

  // Erros de validação
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return 'validation';
  }

  return 'unknown';
}

/**
 * Obtém mensagem amigável para o erro
 */
export function getFriendlyErrorMessage(error: unknown): string {
  const errorType = identifyErrorType(error);
  const errorObj = error as { code?: string };
  const errorCode = errorObj?.code?.toLowerCase() || '';
  const messages = ERROR_MESSAGES[errorType];

  return (
    (messages as Record<string, string>)[errorCode] ||
    (messages as Record<string, string>).default
  );
}

/**
 * Cria um erro estruturado da aplicação
 */
export function createAppError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  const errorType = identifyErrorType(error);

  const errorObj = error as { code?: string };
  return {
    type: errorType,
    code: errorObj?.code || 'unknown',
    message: getFriendlyErrorMessage(error),
    originalError: error instanceof Error ? error : new Error(String(error)),
    context,
    timestamp: new Date(),
  };
}

/**
 * Manipulador principal de erros
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Manipula erro e exibe toast apropriado
   */
  handle(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = createAppError(error, context);

    // Log do erro para debugging
    console.error('Error handled:', appError);
    this.errorLog.push(appError);

    // Manter apenas os últimos 50 erros
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }

    // Exibir toast baseado no tipo de erro
    this.displayToast(appError);

    return appError;
  }

  /**
   * Exibe toast apropriado para o tipo de erro
   */
  private displayToast(appError: AppError): void {
    const options = {
      duration: this.getToastDuration(appError.type),
      id: `error-${appError.type}-${Date.now()}`,
    };

    switch (appError.type) {
      case 'network':
        toast.error(appError.message, { ...options, icon: '🌐' });
        break;
      case 'authentication':
        toast.error(appError.message, { ...options, icon: '🔐' });
        break;
      case 'permission':
        toast.error(appError.message, { ...options, icon: '⛔' });
        break;
      case 'validation':
        toast.error(appError.message, { ...options, icon: '⚠️' });
        break;
      case 'firestore':
        toast.error(appError.message, { ...options, icon: '🔥' });
        break;
      default:
        toast.error(appError.message, { ...options, icon: '❌' });
    }
  }

  /**
   * Determina duração do toast baseado no tipo de erro
   */
  private getToastDuration(errorType: ErrorType): number {
    switch (errorType) {
      case 'network':
        return 6000; // 6 segundos para erros de rede
      case 'authentication':
        return 5000; // 5 segundos para erros de auth
      case 'permission':
        return 7000; // 7 segundos para erros de permissão
      default:
        return 4000; // 4 segundos para outros erros
    }
  }

  /**
   * Verifica se há conectividade
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Implementa retry automático para erros de rede
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorType = identifyErrorType(error);

        // Só fazer retry para erros de rede
        if (errorType !== 'network' || attempt === maxAttempts) {
          throw error;
        }

        // Aguardar antes do próximo attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));

        toast.loading(`Tentativa ${attempt + 1} de ${maxAttempts}...`, {
          id: 'retry-toast',
          duration: delayMs * attempt,
        });
      }
    }

    throw lastError;
  }

  /**
   * Obtém log de erros para debugging
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Limpa log de erros
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Instância global do manipulador de erros
export const errorHandler = ErrorHandler.getInstance();

// Helpers para uso comum
export const handleError = (
  error: unknown,
  context?: Record<string, unknown>
) => errorHandler.handle(error, context);

export const withRetry = <T>(
  operation: () => Promise<T>,
  maxAttempts?: number,
  delayMs?: number
) => errorHandler.withRetry(operation, maxAttempts, delayMs);

// Wrapper para operações do Firestore
export const withFirestoreErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  try {
    return await withRetry(operation);
  } catch (error) {
    throw handleError(error, context);
  }
};
