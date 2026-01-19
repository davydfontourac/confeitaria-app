import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getUserRecipes } from '../services/firestore';
import LoadingSpinner from './LoadingSpinner';
import { useRecipeStats } from '../hooks/useOptimizedCalculations';
import type { Recipe } from '../types/firestore';

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsProps {
  className?: string;
}

export const Analytics = ({ className = '' }: AnalyticsProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const recipesData = await getUserRecipes();
      setRecipes(recipesData);
    } catch (err) {
      console.error('Erro ao carregar receitas para analytics:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Dados para gráfico de receitas mais lucrativas
  const profitabilityData = useMemo(() => {
    const sortedByProfit = [...recipes]
      .sort((a, b) => b.pricing.profit - a.pricing.profit)
      .slice(0, 5);

    return {
      labels: sortedByProfit.map((recipe) =>
        recipe.title.length > 20
          ? recipe.title.substring(0, 20) + '...'
          : recipe.title
      ),
      datasets: [
        {
          label: 'Lucro por Porção (R$)',
          data: sortedByProfit.map((recipe) => recipe.pricing.profit),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(249, 115, 22)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [recipes]);

  // Dados para gráfico de distribuição por categoria
  const categoryData = useMemo(() => {
    const categoryCount = recipes.reduce(
      (acc, recipe) => {
        acc[recipe.category] = (acc[recipe.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);

    return {
      labels: labels.map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1)),
      datasets: [
        {
          label: 'Receitas por Categoria',
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [recipes]);

  // Dados para tendência de custos ao longo do tempo
  const costTrendData = useMemo(() => {
    const sortedByDate = [...recipes].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const labels = sortedByDate.map((recipe) =>
      new Date(recipe.createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Custo Total (R$)',
          data: sortedByDate.map((recipe) => recipe.costs.totalCost),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Preço Final (R$)',
          data: sortedByDate.map((recipe) => recipe.pricing.finalPrice),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [recipes]);

  // Usar hook otimizado para estatísticas
  const stats = useRecipeStats({ recipes });

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <p className="text-red-700">Erro ao carregar analytics: {error}</p>
        <button
          onClick={loadRecipes}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sem dados para análise
        </h3>
        <p className="text-gray-600">
          Crie algumas receitas para ver estatísticas e gráficos detalhados.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Estatísticas Resumidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-gray-600">Total de Receitas</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalRecipes}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-gray-600">Receita Total</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm text-gray-600">Lucro Total</div>
            <div className="text-2xl font-bold text-blue-600">
              R$ {stats.totalProfit.toFixed(2)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-gray-600">Margem Média</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Receitas Mais Lucrativas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Receitas Mais Lucrativas
          </h3>
          <div className="h-64">
            <Bar
              data={profitabilityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `Lucro: R$ ${context.parsed.y.toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Distribuição por Categoria */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎂 Receitas por Categoria
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce(
                          (a: number, b: number) => a + b,
                          0
                        );
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Tendência de Custos */}
      {recipes.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Tendência de Custos ao Longo do Tempo
          </h3>
          <div className="h-64">
            <Line
              data={costTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Melhores e Piores Performances */}
      {stats && stats.mostProfitable && stats.leastProfitable && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              🏆 Receita Mais Lucrativa
            </h3>
            <div className="text-green-800">
              <div className="font-medium">{stats.mostProfitable.title}</div>
              <div className="text-sm text-green-600 mt-1">
                Lucro: R$ {stats.mostProfitable.pricing.profit.toFixed(2)} por
                porção
              </div>
              <div className="text-sm text-green-600">
                Margem: {stats.mostProfitable.pricing.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              ⚠️ Receita Menos Lucrativa
            </h3>
            <div className="text-yellow-800">
              <div className="font-medium">{stats.leastProfitable.title}</div>
              <div className="text-sm text-yellow-600 mt-1">
                Lucro: R$ {stats.leastProfitable.pricing.profit.toFixed(2)} por
                porção
              </div>
              <div className="text-sm text-yellow-600">
                Margem: {stats.leastProfitable.pricing.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
