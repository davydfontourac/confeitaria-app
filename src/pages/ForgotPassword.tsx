import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  submit?: string;
}

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await resetPassword(formData.email);
      setIsEmailSent(true);
    } catch (error: unknown) {
      console.error('Erro ao enviar email:', error);

      // Tratar diferentes tipos de erro do Firebase
      let errorMessage = 'Erro ao enviar email. Tente novamente.';

      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'Usuário não encontrado.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 px-12 py-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-8 shadow-2xl">
                <span className="text-5xl"></span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Email Enviado!
              </h1>
              <p className="text-blue-100 text-lg">
                Verifique sua caixa de entrada
              </p>
            </div>

            {/* Conteúdo */}
            <div className="px-12 py-12">
              <div className="space-y-6 text-center">
                <div className="space-y-4 text-gray-600">
                  <p className="text-lg">
                    Enviamos um link de recuperação para:
                  </p>
                  <p className="font-semibold text-blue-600 text-lg bg-blue-50 px-4 py-3 rounded-xl border-2 border-blue-100">
                    {formData.email}
                  </p>
                  <p className="text-sm">
                    Verifique sua caixa de entrada e spam. O link expira em 1
                    hora.
                  </p>
                </div>

                <div className="space-y-4 pt-6">
                  <button
                    onClick={() => setIsEmailSent(false)}
                    className="w-full py-3 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-700 transition-all duration-200 hover:bg-blue-50"
                  >
                    <span className="mr-2">🔄</span>
                    Enviar novamente
                  </button>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-blue-700 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <span className="mr-2">←</span>
                    Voltar ao login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="text-5xl">🔑</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Recuperar Senha
              </h1>
              <p className="text-blue-100 text-xl mb-8 max-w-md">
                Digite seu email para receber o link de recuperação
              </p>
              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">✉️</span>
                  <span>Email seguro em segundos</span>
                </div>
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">🔐</span>
                  <span>Redefina sua senha com segurança</span>
                </div>
                <div className="flex items-center text-white/90">
                  <span className="text-2xl mr-3">⏱️</span>
                  <span>Link válido por 1 hora</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="px-12 py-16 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Recupere sua senha
              </h2>
              <p className="text-gray-600">Digite seu email abaixo</p>
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
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
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

              {/* Botão enviar */}
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
                    Enviando...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2"></span>
                    Enviar Link de Recuperação
                  </span>
                )}
              </button>
            </form>

            {/* Links de navegação */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  <span className="mr-2">←</span>
                  Voltar ao login
                </Link>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-3">Não tem uma conta?</p>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-2 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-700 transition-all duration-200 hover:bg-blue-50"
                >
                  <span className="mr-2">👤</span>
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
