import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getUserProfile } from '../services/firestore';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSEO } from '../hooks/useSEO';
import AdminOnly from '../components/AdminOnly';

// Lazy loading dos componentes pesados
const Analytics = lazy(() => import('../components/Analytics'));
const BackupExport = lazy(() => import('../components/BackupExport'));

import type { DashboardStats, UserProfile } from '../types/firestore';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  // SEO para a página de Dashboard
  useSEO({
    title: 'Dashboard',
    description:
      'Painel principal da Confeitaria App. Visualize estatísticas das suas receitas, custos e gerencie seu negócio de confeitaria.',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carregar estatísticas e perfil em paralelo
      const [dashboardStats, profile] = await Promise.all([
        getDashboardStats(),
        getUserProfile(),
      ]);

      setStats(dashboardStats);
      setUserProfile(profile);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Se estiver carregando, mostrar skeleton completo
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo,{' '}
          {userProfile?.displayName || currentUser?.displayName || 'Chef'}! 👋
        </h1>
        <p className="text-gray-600">
          Gerencie suas receitas e calcule preços de forma inteligente.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/nova-receita"
          className="bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white p-6 rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105"
        >
          <div className="text-3xl mb-3">➕</div>
          <h3 className="text-lg font-semibold mb-2">Nova Receita</h3>
          <p className="text-pink-100 text-sm">
            Crie uma nova receita e calcule automaticamente os custos
          </p>
        </Link>

        <Link
          to="/minhas-receitas"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
            Minhas Receitas
          </h3>
          <p className="text-gray-600 text-sm">
            Visualize e gerencie suas receitas salvas
          </p>
        </Link>

        <button
          onClick={() => {
            setShowAnalytics(!showAnalytics);
            setShowBackup(false);
          }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group text-left w-full"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
            Analytics
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Análise de custos e lucratividade
          </p>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {showAnalytics ? 'Ocultar' : 'Ver'} gráficos
          </span>
        </button>

        <button
          onClick={() => {
            setShowBackup(!showBackup);
            setShowAnalytics(false);
          }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group text-left w-full"
        >
          <div className="text-3xl mb-3">💾</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            Backup
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Exportar e importar receitas
          </p>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            {showBackup ? 'Ocultar' : 'Ver'} opções
          </span>
        </button>
      </div>

      {/* Estatísticas */}
      {error ? (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Erro ao carregar estatísticas: {error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover-lift animate-fade-in stagger-item">
            <div className="flex items-center">
              <div className="text-2xl mr-3 transition-transform-smooth hover:scale-110">
                📄
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Receitas</p>
                <p className="text-2xl font-bold text-gray-900 transition-colors-smooth">
                  {stats?.totalRecipes || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <p className="text-sm text-gray-600">Receita + Lucrativa</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.mostProfitableRecipe
                    ? `R$ ${stats.mostProfitableRecipe.profit.toFixed(2)}`
                    : 'R$ 0,00'}
                </p>
                {stats?.mostProfitableRecipe && (
                  <p className="text-xs text-gray-500 truncate">
                    {stats.mostProfitableRecipe.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💡</div>
              <div>
                <p className="text-sm text-gray-600">Custo Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {stats?.averageCost.toFixed(2) || '0,00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm text-gray-600">Margem Média</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.averageMargin.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {showAnalytics && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Analytics Detalhado
            </h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Fechar Analytics"
            >
              ✖️
            </button>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Analytics />
          </Suspense>
        </div>
      )}

      {/* Backup e Export */}
      {showBackup && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              💾 Backup e Export
            </h2>
            <button
              onClick={() => setShowBackup(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Fechar Backup"
            >
              ✖️
            </button>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <BackupExport />
          </Suspense>
        </div>
      )}

      {/* Receitas Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Receitas Recentes
            </h2>
            {stats && stats.totalRecipes > 0 && (
              <button
                onClick={loadDashboardData}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🔄 Atualizar
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats && stats.recentRecipes.length > 0 ? (
            <div className="space-y-4">
              {stats.recentRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {recipe.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Criado em {recipe.createdAt.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Última atualização
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {recipe.createdAt.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {stats.totalRecipes > stats.recentRecipes.length && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-gray-500 text-sm">
                    E mais {stats.totalRecipes - stats.recentRecipes.length}{' '}
                    receita
                    {stats.totalRecipes - stats.recentRecipes.length > 1
                      ? 's'
                      : ''}
                    ...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma receita ainda
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira receita para começar a calcular custos e
                preços.
              </p>
              <Link
                to="/nova-receita"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <span className="mr-2">➕</span>
                Criar primeira receita
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Status do Desenvolvimento - apenas admin */}
      <AdminOnly>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🚧</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Dashboard em Desenvolvimento
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Estamos seguindo o cronograma de desenvolvimento. Próximas
                funcionalidades:
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• ✅ Sistema de autenticação (Concluído)</li>
                <li>• ✅ Roteamento e layout (Concluído)</li>
                <li>• ✅ Dashboard base (Concluído)</li>
                <li>• ✅ Estrutura Firestore (Concluído)</li>
                <li>• ✅ Formulário dinâmico de receitas (Concluído)</li>
                <li>• ✅ Sistema de cálculos automáticos (Concluído)</li>
              </ul>
            </div>
          </div>
        </div>
      </AdminOnly>
    </div>
  );
};

export default Dashboard;
