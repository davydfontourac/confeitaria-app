import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authToast, handleFirebaseError } from '../services/toast';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

// Validações
const validateEmail = (email: string): string | undefined => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email é obrigatório';
  if (!emailRegex.test(email)) return 'Email inválido';
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
  return undefined;
};

const validateName = (name: string): string | undefined => {
  if (!name) return 'Nome é obrigatório';
  if (name.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
  return undefined;
};

const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) return 'Confirmação de senha é obrigatória';
  if (password !== confirmPassword) return 'As senhas não conferem';
  return undefined;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulário
    const newErrors: FormErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    // Se houver erros, mostrar e retornar
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
    } catch (error: unknown) {
      console.error('Erro no registro:', error);

      let errorMessage = 'Erro ao criar conta. Tente novamente.';

      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email já está em uso.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Senha muito fraca.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      authToast.registering();
      await loginWithGoogle();
      authToast.registerSuccess();
    } catch (error) {
      console.error('Erro ao criar conta com Google:', error);
      const message = handleFirebaseError(error);
      setErrors({ submit: message });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-blue-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg">
              <span className="text-4xl">🧁</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
            <p className="text-pink-100 text-lg">
              Preencha seus dados para começar
            </p>
          </div>
          <div className="px-8 py-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Erro geral */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Nome Completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${
                    errors.name ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

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
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${
                      errors.password ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    title={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 transform bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              {/* Criar conta com Google */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isGoogleLoading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-gray-700 border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isGoogleLoading
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>🧁</span>
                <span>
                  {isGoogleLoading ? 'Conectando...' : 'Criar conta com Google'}
                </span>
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">Já tem uma conta?</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50"
              >
                <span className="mr-2">🔑</span>
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
