import React, { useState } from 'react';
import { useMobile } from '../hooks/useDevice';
import { MobileButton } from './MobileOptimized';

interface FeedbackData {
  name: string;
  email: string;
  userType: 'developer' | 'baker' | 'other';
  rating: number;
  easeOfUse: number;
  mostUseful: string;
  improvements: string;
  bugs: string;
  wouldRecommend: boolean;
  additionalComments: string;
}

/**
 * Componente para coleta de feedback estruturado
 * Usado durante a fase de testes com usuários
 */
export const FeedbackForm: React.FC = () => {
  const isMobile = useMobile();
  const [feedback, setFeedback] = useState<FeedbackData>({
    name: '',
    email: '',
    userType: 'other',
    rating: 5,
    easeOfUse: 5,
    mostUseful: '',
    improvements: '',
    bugs: '',
    wouldRecommend: true,
    additionalComments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular envio - em produção seria para um serviço real
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Salvar no localStorage para desenvolvimento
      const existingFeedback = JSON.parse(
        localStorage.getItem('feedbackData') || '[]'
      );
      existingFeedback.push({
        ...feedback,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('feedbackData', JSON.stringify(existingFeedback));

      setIsSubmitted(true);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (field: 'rating' | 'easeOfUse', value: number) => {
    setFeedback((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Obrigado pelo seu feedback!
          </h2>
          <p className="text-green-700">
            Suas sugestões são muito valiosas para melhorar o WebApp
            Confeitaria.
          </p>
          <MobileButton
            onClick={() => {
              setIsSubmitted(false);
              setFeedback({
                name: '',
                email: '',
                userType: 'other',
                rating: 5,
                easeOfUse: 5,
                mostUseful: '',
                improvements: '',
                bugs: '',
                wouldRecommend: true,
                additionalComments: '',
              });
            }}
            variant="secondary"
            className="mt-4"
          >
            Enviar Outro Feedback
          </MobileButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${isMobile ? 'mx-4' : ''}`}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧁 Feedback - WebApp Confeitaria
        </h1>
        <p className="text-gray-600">
          Sua opinião é fundamental para melhorar a experiência!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome (opcional)
            </label>
            <input
              type="text"
              value={feedback.name}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (opcional)
            </label>
            <input
              type="email"
              value={feedback.email}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        {/* Tipo de Usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Você é:
          </label>
          <select
            value={feedback.userType}
            onChange={(e) =>
              setFeedback((prev) => ({
                ...prev,
                userType: e.target.value as 'developer' | 'baker' | 'other',
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="baker">Confeiteiro(a) / Baker</option>
            <option value="developer">Desenvolvedor(a)</option>
            <option value="other">Outro</option>
          </select>
        </div>

        {/* Avaliações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avaliação Geral (1-5 estrelas)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange('rating', star)}
                  className={`text-2xl ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facilidade de Uso (1-5)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleRatingChange('easeOfUse', level)}
                  className={`w-8 h-8 rounded ${level <= feedback.easeOfUse ? 'bg-green-400' : 'bg-gray-300'} hover:bg-green-400 transition-colors`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Perguntas Abertas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qual funcionalidade achou mais útil?
          </label>
          <textarea
            value={feedback.mostUseful}
            onChange={(e) =>
              setFeedback((prev) => ({ ...prev, mostUseful: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ex: Cálculo automático de custos, dashboard com gráficos, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            O que poderia ser melhorado?
          </label>
          <textarea
            value={feedback.improvements}
            onChange={(e) =>
              setFeedback((prev) => ({ ...prev, improvements: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Suas sugestões para melhorar a experiência..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Encontrou algum bug ou problema?
          </label>
          <textarea
            value={feedback.bugs}
            onChange={(e) =>
              setFeedback((prev) => ({ ...prev, bugs: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Descreva qualquer erro ou comportamento inesperado..."
          />
        </div>

        {/* Recomendação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recomendaria para outros confeiteiros?
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={feedback.wouldRecommend === true}
                onChange={() =>
                  setFeedback((prev) => ({ ...prev, wouldRecommend: true }))
                }
                className="mr-2"
              />
              Sim
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={feedback.wouldRecommend === false}
                onChange={() =>
                  setFeedback((prev) => ({ ...prev, wouldRecommend: false }))
                }
                className="mr-2"
              />
              Não
            </label>
          </div>
        </div>

        {/* Comentários Adicionais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentários Adicionais
          </label>
          <textarea
            value={feedback.additionalComments}
            onChange={(e) =>
              setFeedback((prev) => ({
                ...prev,
                additionalComments: e.target.value,
              }))
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Qualquer outra observação ou sugestão..."
          />
        </div>

        {/* Botão de Envio */}
        <div className="text-center">
          <MobileButton
            type="submit"
            loading={isSubmitting}
            size="lg"
            className="w-full md:w-auto px-8"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </MobileButton>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 text-center">
          💡 <strong>Dica:</strong> Teste todas as funcionalidades antes de
          enviar o feedback: criar receita, dashboard, analytics, backup/export,
          responsividade mobile.
        </p>
      </div>
    </div>
  );
};
