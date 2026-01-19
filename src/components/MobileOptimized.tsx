import React, { useState, useEffect } from 'react';
import { useMobile } from '../hooks/useDevice';

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente para otimizar layout em dispositivos móveis
 * Aplica melhorias automáticas de UX/UI móvel
 */
export const MobileOptimized: React.FC<MobileOptimizedProps> = ({
  children,
  className = '',
}) => {
  const isMobile = useMobile();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );

  useEffect(() => {
    const checkOrientation = () => {
      const currentOrientation =
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(currentOrientation);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Classes CSS específicas para móvel
  const mobileClasses = isMobile
    ? [
        'touch-manipulation', // Melhora performance de toque
        'select-none', // Previne seleção acidental de texto
        'overscroll-none', // Previne bounce scroll
        'text-base', // Tamanho de fonte apropriado para mobile
        orientation === 'portrait' ? 'mobile-portrait' : 'mobile-landscape',
      ].join(' ')
    : '';

  return (
    <div
      className={`${mobileClasses} ${className}`}
      style={
        isMobile
          ? {
              WebkitTapHighlightColor: 'transparent', // Remove highlight azul no iOS
              WebkitTouchCallout: 'none', // Desabilita menu de contexto longo
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }
          : {}
      }
    >
      {children}
    </div>
  );
};

/**
 * Componente para inputs otimizados para móvel
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  icon,
  className = '',
  type = 'text',
  ...props
}) => {
  const isMobile = useMobile();

  // Keyboards específicos para móvel
  const getInputMode = () => {
    switch (type) {
      case 'number':
        return 'numeric';
      case 'tel':
        return 'tel';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  };

  const inputClasses = [
    'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200',
    isMobile ? 'text-base min-h-[44px]' : 'text-sm', // Tamanho mínimo de toque (44px)
    error ? 'border-red-500 bg-red-50' : 'border-gray-300',
    icon ? 'pl-12' : '',
    className,
  ].join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          inputMode={getInputMode()}
          autoComplete={
            type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'
          }
          className={inputClasses}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

/**
 * Componente para botões otimizados para móvel
 */
interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const isMobile = useMobile();

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizeClasses = {
    sm: isMobile ? 'px-4 py-2 text-sm min-h-[40px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-3 text-base min-h-[44px]' : 'px-4 py-2 text-sm',
    lg: isMobile ? 'px-8 py-4 text-lg min-h-[48px]' : 'px-6 py-3 text-base',
  };

  const buttonClasses = [
    'font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200',
    'touch-manipulation', // Melhora resposta ao toque
    'active:scale-95', // Feedback visual no toque
    variantClasses[variant],
    sizeClasses[size],
    loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md',
    className,
  ].join(' ');

  return (
    <button className={buttonClasses} disabled={loading || disabled} {...props}>
      <div className="flex items-center justify-center space-x-2">
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : icon ? (
          <span>{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </div>
    </button>
  );
};

/**
 * Componente para modais otimizados para móvel
 */
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const isMobile = useMobile();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'w-full h-full' : 'max-w-sm',
    md: isMobile ? 'w-full h-full' : 'max-w-lg',
    lg: isMobile ? 'w-full h-full' : 'max-w-2xl',
    full: 'w-full h-full',
  };

  const modalClasses = isMobile
    ? 'fixed inset-0 bg-white z-50 overflow-y-auto'
    : `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`;

  const contentClasses = isMobile
    ? 'h-full flex flex-col'
    : `bg-white rounded-lg shadow-xl ${sizeClasses[size]} max-h-[90vh] overflow-hidden`;

  return (
    <div className={modalClasses} onClick={isMobile ? undefined : onClose}>
      <div className={contentClasses} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div
            className={`${isMobile ? 'sticky top-0 bg-white z-10 shadow-sm' : ''} px-6 py-4 border-b flex items-center justify-between`}
          >
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div
          className={`${isMobile ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
