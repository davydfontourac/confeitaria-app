import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserRecipes, deleteRecipe } from '../services/firestore';
import { handleFirebaseError, toastWithLoading } from '../services/toast';
import { RecipeCardSkeleton } from '../components/SkeletonLoader';
import ConfirmModal from '../components/ConfirmModal';
import type { Recipe } from '../types/firestore';

const MinhasReceitas = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'alphabetical' | 'cost'
  >('newest');

  // Estados para modal de confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    recipeId: string;
    recipeName: string;
  }>({
    isOpen: false,
    recipeId: '',
    recipeName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecipes = useCallback(async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const userRecipes = await getUserRecipes(50);
      setRecipes(userRecipes);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
      const errorMessage = 'Erro ao carregar receitas. Tente novamente.';
      setError(errorMessage);
      handleFirebaseError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleDeleteRecipe = (recipeId: string, recipeName: string) => {
    setConfirmModal({
      isOpen: true,
      recipeId,
      recipeName,
    });
  };

  const confirmDeleteRecipe = async () => {
    if (!confirmModal.recipeId) return;

    setIsDeleting(true);

    try {
      await toastWithLoading(() => deleteRecipe(confirmModal.recipeId), {
        loading: '🗑️ Excluindo receita...',
        success: `✅ Receita "${confirmModal.recipeName}" excluída com sucesso!`,
        error: 'Erro ao excluir receita',
      });

      setRecipes((prev) => prev.filter((r) => r.id !== confirmModal.recipeId));
      setConfirmModal({ isOpen: false, recipeId: '', recipeName: '' });
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      handleFirebaseError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteRecipe = () => {
    if (!isDeleting) {
      setConfirmModal({ isOpen: false, recipeId: '', recipeName: '' });
    }
  };

  // Filtrar e ordenar receitas
  const filteredAndSortedRecipes = recipes
    .filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'todas' || recipe.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'cost':
          return (
            (b.costs?.costPerServing || 0) - (a.costs?.costPerServing || 0)
          );
        default:
          return 0;
      }
    });

  const categories = Array.from(new Set(recipes.map((r) => r.category)));

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📚 Minhas Receitas
              </h1>
              <p className="text-gray-600 mt-1">
                {recipes.length} receita{recipes.length !== 1 ? 's' : ''}{' '}
                encontrada{recipes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/nova-receita"
              className="bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium btn-animated animate-fade-in"
            >
              ➕ Nova Receita
            </Link>
          </div>

          {/* Filtros e busca */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar receitas
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome, descrição ou tag..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🗂️ Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="todas">Todas</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | 'newest'
                        | 'oldest'
                        | 'alphabetical'
                        | 'cost'
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="oldest">Mais antigas</option>
                  <option value="alphabetical">Alfabética</option>
                  <option value="cost">Maior custo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <RecipeCardSkeleton count={6} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadRecipes}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'todas'
                ? 'Nenhuma receita encontrada'
                : 'Nenhuma receita ainda'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'todas'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira receita!'}
            </p>
            {!searchTerm && selectedCategory === 'todas' && (
              <Link
                to="/nova-receita"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-600 text-white rounded-lg hover:from-pink-600 hover:to-blue-700 transition-all duration-200"
              >
                ➕ Criar primeira receita
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={() => handleDeleteRecipe(recipe.id, recipe.title)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={cancelDeleteRecipe}
        onConfirm={confirmDeleteRecipe}
        title="Excluir Receita"
        message={`Tem certeza que deseja excluir a receita "${confirmModal.recipeName}"? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// Componente do card de receita
const RecipeCard = ({
  recipe,
  onDelete,
}: {
  recipe: Recipe;
  onDelete: () => void;
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden recipe-card animate-fade-in stagger-item">
      {/* Header do card */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {getCategoryEmoji(recipe.category)}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {recipe.title}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {recipe.category}
              </p>
            </div>
          </div>

          <div className="flex space-x-1">
            <Link
              to={`/receita/${recipe.id}`}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              title="Ver receita"
            >
              👁️
            </Link>
            <Link
              to={`/receita/${recipe.id}/editar`}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
              title="Editar receita"
            >
              ✏️
            </Link>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
              title="Excluir receita"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Descrição */}
        {recipe.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Porções:</span>
            <span className="font-medium ml-1">{recipe.servings}</span>
          </div>
          <div>
            <span className="text-gray-500">Ingredientes:</span>
            <span className="font-medium ml-1">
              {recipe.ingredients.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Preparo:</span>
            <span className="font-medium ml-1">{recipe.prepTime}min</span>
          </div>
          <div>
            <span className="text-gray-500">Cozimento:</span>
            <span className="font-medium ml-1">{recipe.cookTime}min</span>
          </div>
        </div>

        {/* Custo e dificuldade */}
        <div className="flex items-center justify-between mt-4">
          <div>
            {recipe.costs && (
              <div className="text-sm">
                <span className="text-gray-500">Custo/porção:</span>
                <span className="font-bold text-green-600 ml-1">
                  R$ {recipe.costs.costPerServing.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}
            >
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Data de criação */}
        <div className="text-xs text-gray-400 mt-3">
          Criada em {new Date(recipe.createdAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default MinhasReceitas;
