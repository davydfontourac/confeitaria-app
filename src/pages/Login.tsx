import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authToast, handleFirebaseError } from '../services/toast';
import { useSEO } from '../hooks/useSEO';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // SEO para a página de Login
  useSEO({
    title: 'Login',
    description:
      'Entre na sua conta da Confeitaria App para acessar suas receitas e gerenciar seu negócio de confeitaria.',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro quando usuário começar a digitar
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Validação de email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação de senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); // Limpar erros anteriores

    authToast.loggingIn();

    try {
      await login(formData.email, formData.password);
      authToast.loginSuccess();
      // O redirecionamento será feito pelo useEffect quando currentUser mudar
    } catch (error: unknown) {
      console.error('Erro no login:', error);

      // Usar o handler centralizado de erros do Firebase
      const errorMessage = handleFirebaseError(error);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      authToast.loggingIn();
      await loginWithGoogle();
      authToast.loginSuccess();
    } catch (error) {
      console.error('Erro no login com Google:', error);
      const errorMessage = handleFirebaseError(error);
      setErrors({ submit: errorMessage });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Container principal em grid */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden grid lg:grid-cols-2 gap-0">
          {/* Coluna Esquerda - Branding */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-12 py-16 flex flex-col justify-center items-center text-center lg:min-h-[600px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-8 shadow-2xl">
                <span className="text-5xl">🧁</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                WebApp Confeitaria
              </h1>
              <p className="text-pink-100 text-xl mb-8 max-w-md">
                Gerencie suas receitas, calcule custos e impulsione seu negócio
                de confeitaria
              </p>
              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">✨</span>
                  <span>Organize todas suas receitas</span>
                </div>
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">💰</span>
                  <span>Calcule custos automaticamente</span>
                </div>
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">📊</span>
                  <span>Acompanhe seu desempenho</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="px-12 py-16 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-600">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    errors.email
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 focus:bg-white'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                      errors.password
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 focus:bg-white'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Link esqueceu senha */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              {/* Erro geral */}
              {errors.submit && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-red-400 mr-2">❌</span>
                    <p className="text-sm text-red-700 font-medium">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-xl text-white font-semibold text-base transition-all duration-200 transform ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-blue-700 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Entrando...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2"></span>
                    Entrar
                  </span>
                )}
              </button>

              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">ou</span>
                </div>
              </div>

              {/* Login com Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-gray-700 border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isGoogleLoading
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'border-gray-300 hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>
                  {isGoogleLoading ? 'Conectando...' : 'Entrar com Google'}
                </span>
              </button>
            </form>

            {/* Link para cadastro */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-3">Não tem uma conta?</p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-2 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-pink-500 hover:text-pink-600 transition-all duration-200 hover:bg-pink-50"
              >
                <span className="mr-2">👤</span>
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
