import React, { useState, useEffect } from 'react';
import { MobileOptimized } from '../components/MobileOptimized';

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
  timestamp: string;
}

/**
 * Página administrativa para visualizar feedbacks coletados
 * Acesso via /admin/feedback (para desenvolvimento)
 */
const FeedbackAdmin: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [filter, setFilter] = useState<'all' | 'developer' | 'baker' | 'other'>(
    'all'
  );

  useEffect(() => {
    // Carregar feedbacks do localStorage
    const storedFeedbacks = localStorage.getItem('feedbackData');
    if (storedFeedbacks) {
      setFeedbacks(JSON.parse(storedFeedbacks));
    }
  }, []);

  const filteredFeedbacks = feedbacks.filter(
    (feedback) => filter === 'all' || feedback.userType === filter
  );

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

  const averageEaseOfUse =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.easeOfUse, 0) / feedbacks.length
      : 0;

  const recommendationRate =
    feedbacks.length > 0
      ? (feedbacks.filter((f) => f.wouldRecommend).length / feedbacks.length) *
        100
      : 0;

  const exportFeedbacks = () => {
    const dataStr = JSON.stringify(feedbacks, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `feedbacks_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearFeedbacks = () => {
    if (confirm('Tem certeza que quer limpar todos os feedbacks?')) {
      localStorage.removeItem('feedbackData');
      setFeedbacks([]);
    }
  };

  return (
    <MobileOptimized className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Admin - Feedbacks Coletados
            </h1>
            <p className="text-gray-600">
              Análise dos feedbacks dos testadores do WebApp Confeitaria
            </p>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {feedbacks.length}
              </div>
              <div className="text-gray-600">Total de Feedbacks</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-gray-600">Avaliação Média</div>
              <div className="text-yellow-400 text-lg">
                {'⭐'.repeat(Math.round(averageRating))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {averageEaseOfUse.toFixed(1)}
              </div>
              <div className="text-gray-600">Facilidade de Uso</div>
              <div className="text-sm text-gray-500">de 5.0</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {recommendationRate.toFixed(0)}%
              </div>
              <div className="text-gray-600">Recomendariam</div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium text-gray-700">
                  Filtrar por tipo:
                </label>
                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(
                      e.target.value as 'all' | 'developer' | 'baker' | 'other'
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos ({feedbacks.length})</option>
                  <option value="baker">
                    Confeiteiros (
                    {feedbacks.filter((f) => f.userType === 'baker').length})
                  </option>
                  <option value="developer">
                    Desenvolvedores (
                    {feedbacks.filter((f) => f.userType === 'developer').length}
                    )
                  </option>
                  <option value="other">
                    Outros (
                    {feedbacks.filter((f) => f.userType === 'other').length})
                  </option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={exportFeedbacks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={clearFeedbacks}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Limpar Tudo
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Feedbacks */}
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum feedback encontrado
              </h3>
              <p className="text-gray-500">
                Compartilhe o link /feedback com testadores para começar a
                coletar insights!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFeedbacks.map((feedback, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  {/* Header do Feedback */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {feedback.name || 'Anônimo'}
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {feedback.userType === 'baker'
                            ? '🧁 Confeiteiro'
                            : feedback.userType === 'developer'
                              ? '💻 Dev'
                              : '👤 Outro'}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(feedback.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-lg">
                        {'⭐'.repeat(feedback.rating)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Facilidade: {feedback.easeOfUse}/5
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo do Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feedback.mostUseful && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">
                          ✅ Mais Útil:
                        </h4>
                        <p className="text-gray-700 bg-green-50 p-3 rounded">
                          {feedback.mostUseful}
                        </p>
                      </div>
                    )}

                    {feedback.improvements && (
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">
                          💡 Melhorias:
                        </h4>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded">
                          {feedback.improvements}
                        </p>
                      </div>
                    )}

                    {feedback.bugs && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-red-700 mb-2">
                          🐛 Bugs Reportados:
                        </h4>
                        <p className="text-gray-700 bg-red-50 p-3 rounded">
                          {feedback.bugs}
                        </p>
                      </div>
                    )}

                    {feedback.additionalComments && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-700 mb-2">
                          💬 Comentários Adicionais:
                        </h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">
                          {feedback.additionalComments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        feedback.wouldRecommend
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {feedback.wouldRecommend
                        ? '👍 Recomendaria'
                        : '👎 Não recomendaria'}
                    </div>
                    {feedback.email && (
                      <a
                        href={`mailto:${feedback.email}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        📧 {feedback.email}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumo de Insights */}
          {feedbacks.length > 0 && (
            <div className="mt-12 bg-indigo-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-indigo-900 mb-4">
                🔍 Insights para Ação
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">
                    ✅ Pontos Fortes:
                  </h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Avaliação média: {averageRating.toFixed(1)}/5</li>
                    <li>• {recommendationRate.toFixed(0)}% recomendariam</li>
                    <li>• Facilidade: {averageEaseOfUse.toFixed(1)}/5</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    💡 Melhorias Sugeridas:
                  </h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Revisar feedbacks individuais</li>
                    <li>• Focar em bugs reportados</li>
                    <li>• Implementar sugestões recorrentes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-red-800 mb-2">
                    🚨 Ações Prioritárias:
                  </h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Corrigir bugs críticos</li>
                    <li>• Melhorar pontos de baixa avaliação</li>
                    <li>• Testar com mais usuários</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileOptimized>
  );
};

export default FeedbackAdmin;
