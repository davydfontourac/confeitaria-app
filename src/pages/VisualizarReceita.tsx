import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRecipe, deleteRecipe } from '../services/firestore';
import type { Recipe } from '../types/firestore';

const VisualizarReceita = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipe = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const recipeData = await getRecipe(id);

      if (!recipeData) {
        setError('Receita não encontrada');
        return;
      }

      // Verificar se o usuário atual é o dono da receita
      if (recipeData.userId !== currentUser?.uid) {
        setError('Você não tem permissão para visualizar esta receita');
        return;
      }

      setRecipe(recipeData);
    } catch (err) {
      console.error('Erro ao carregar receita:', err);
      setError('Erro ao carregar receita. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (!id) {
      navigate('/minhas-receitas');
      return;
    }

    loadRecipe();
  }, [id, navigate, loadRecipe]);

  const handleDeleteRecipe = async () => {
    if (!recipe || !id) return;

    if (
      !confirm(
        `Tem certeza que deseja excluir a receita "${recipe.title}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await deleteRecipe(id);
      alert('Receita excluída com sucesso!');
      navigate('/minhas-receitas');
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      alert('Erro ao excluir receita. Tente novamente.');
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      doces: '🧁',
      salgados: '🥪',
      bolos: '🎂',
      tortas: '🥧',
      biscoitos: '🍪',
      bebidas: '🥤',
      massas: '🍝',
      carnes: '🥩',
      vegetarianos: '🥗',
      sobremesas: '🍰',
    };
    return emojis[category.toLowerCase()] || '🍽️';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil':
        return 'text-green-600 bg-green-100';
      case 'médio':
        return 'text-yellow-600 bg-yellow-100';
      case 'difícil':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando receita...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <p className="text-red-600 mb-4">
            {error || 'Receita não encontrada'}
          </p>
          <Link
            to="/minhas-receitas"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Voltar às receitas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com ações */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/minhas-receitas"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar às receitas
            </Link>

            <div className="flex space-x-2">
              <Link
                to={`/receita/${id}/editar`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✏️ Editar
              </Link>
              <button
                onClick={handleDeleteRecipe}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título e informações principais */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">
                {getCategoryEmoji(recipe.category)}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {recipe.title}
                </h1>
                <p className="text-gray-600 capitalize">{recipe.category}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Descrição */}
          {recipe.description && (
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Informações rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recipe.servings}
              </div>
              <div className="text-sm text-gray-600">Porções</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recipe.prepTime}
              </div>
              <div className="text-sm text-gray-600">Min preparo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {recipe.cookTime}
              </div>
              <div className="text-sm text-gray-600">Min cozimento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {recipe.totalTime}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            🥄 Ingredientes
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({recipe.ingredients.length} ingredientes)
            </span>
          </h2>

          <div className="space-y-4">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id}
                className="flex items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {ingredient.quantity} {ingredient.unit} de {ingredient.name}
                  </div>
                  {ingredient.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      💡 {ingredient.notes}
                    </div>
                  )}
                  {ingredient.supplier && (
                    <div className="text-xs text-gray-500 mt-1">
                      Fornecedor: {ingredient.supplier}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    R${' '}
                    {(ingredient.quantity * ingredient.costPerUnit).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    R$ {ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📝 Modo de Preparo
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({recipe.instructions.length} passos)
            </span>
          </h2>

          <ol className="space-y-6">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">{instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Análise de Custos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💰 Análise de Custos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Breakdown de custos */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Detalhamento de Custos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Ingredientes:</span>
                  <span className="font-medium">
                    R$ {recipe.costs.totalIngredientsCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Mão de obra:</span>
                  <span className="font-medium">
                    R$ {recipe.costs.laborCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Custos indiretos:</span>
                  <span className="font-medium">
                    R$ {recipe.costs.overheadCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t border-gray-300 font-bold text-lg">
                  <span className="text-gray-800">Custo Total:</span>
                  <span className="text-blue-600">
                    R$ {recipe.costs.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-green-50 px-3 rounded-lg">
                  <span className="text-gray-800 font-medium">
                    Custo por Porção:
                  </span>
                  <span className="text-green-600 font-bold">
                    R$ {recipe.costs.costPerServing.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Análise de preços */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Análise de Preços
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {recipe.pricing.suggestedPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700">Preço Sugerido</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {recipe.pricing.profit.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700">
                      Lucro por Porção
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {recipe.pricing.profitMargin.toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-700">
                      Margem de Lucro
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Margem configurada:</span>
                    <span>{recipe.pricing.marginPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metadados */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Receita criada em{' '}
            {new Date(recipe.createdAt).toLocaleDateString('pt-BR')} às{' '}
            {new Date(recipe.createdAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {recipe.updatedAt !== recipe.createdAt && (
            <p>
              Última atualização em{' '}
              {new Date(recipe.updatedAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(recipe.updatedAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizarReceita;
