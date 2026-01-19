import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IngredientRow from '../components/IngredientRow';
import TagsInput from '../components/TagsInput';
import {
  createRecipe,
  updateRecipe,
  getRecipe,
  validateRecipeData,
  createUserProfile,
  getUserProfile,
  getUserIngredientSuggestions,
  saveDraft,
  getUserDrafts,
  updateDraft,
  deleteDraft,
} from '../services/firestore';
import {
  recipeToast,
  handleFirebaseError,
  toastWithLoading,
  generalToast,
} from '../services/toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../hooks/useAuth';
import { useSEO } from '../hooks/useSEO';
import type { RecipeFormData, RecipeCategory } from '../types/firestore';
import { RECIPE_CATEGORIES } from '../types/firestore';

const NovaReceita = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Verificar se estamos em modo de edição
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  // SEO dinâmico baseado no modo
  useSEO({
    title: isEditMode ? 'Editar Receita' : 'Nova Receita',
    description: isEditMode
      ? 'Edite sua receita de confeitaria, ajuste ingredientes e recalcule custos automaticamente.'
      : 'Crie uma nova receita de confeitaria com cálculo automático de custos e ingredientes.',
  });

  // Estado do formulário
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    category: 'bolos',
    servings: 1,
    ingredients: [
      {
        name: '',
        quantity: 0,
        unit: 'g',
        costPerUnit: 0,
        supplier: '',
        notes: '',
      },
    ],
    instructions: [''],
    prepTime: 0,
    cookTime: 0,
    tags: [],
    difficulty: 'fácil',
    marginPercentage: 30,
    laborCostPerHour: 15,
    overheadPercentage: 10,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('basic');
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>(
    []
  );
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showClearFormModal, setShowClearFormModal] = useState(false);

  // Função para garantir que o usuário tenha um perfil
  const ensureUserProfile = useCallback(async () => {
    if (!currentUser) return;

    try {
      const profile = await getUserProfile();
      if (!profile) {
        await createUserProfile({
          displayName: currentUser.displayName || 'Chef',
          email: currentUser.email || '',
        });
      }
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
    }
  }, [currentUser]);

  // Carregar receita para edição
  useEffect(() => {
    const loadRecipeForEdit = async () => {
      if (!editId || !currentUser) return;

      try {
        setIsLoading(true);
        const recipe = await getRecipe(editId);

        if (recipe && recipe.userId === currentUser.uid) {
          // Converter a receita para o formato do formulário
          setFormData({
            title: recipe.title,
            description: recipe.description || '',
            category: recipe.category,
            servings: recipe.servings,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            prepTime: recipe.prepTime || 0,
            cookTime: recipe.cookTime || 0,
            tags: recipe.tags || [],
            difficulty: recipe.difficulty || 'fácil',
            marginPercentage: recipe.pricing?.marginPercentage || 30,
            laborCostPerHour: 15, // Valor padrão, pois não está armazenado na receita
            overheadPercentage: 10, // Valor padrão, pois não está armazenado na receita
          });
        }
      } catch (error) {
        console.error('Erro ao carregar receita para edição:', error);
        setErrors(['Erro ao carregar receita para edição']);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipeForEdit();
  }, [editId, currentUser]);

  // Inicializar perfil do usuário se necessário
  useEffect(() => {
    ensureUserProfile();

    // Carregar sugestões de ingredientes
    const loadIngredientSuggestions = async () => {
      try {
        const suggestions = await getUserIngredientSuggestions();
        setIngredientSuggestions(suggestions);
      } catch (error) {
        console.error('Erro ao carregar sugestões de ingredientes:', error);
      }
    };

    loadIngredientSuggestions();
  }, [ensureUserProfile]);

  // Funções de cálculo refinadas
  const calculateIngredientsCost = useCallback(() => {
    return formData.ingredients.reduce(
      (sum, ing) => sum + (ing.quantity || 0) * (ing.costPerUnit || 0),
      0
    );
  }, [formData.ingredients]);

  const calculateLaborCost = useCallback(() => {
    const totalTimeHours =
      ((formData.prepTime || 0) + (formData.cookTime || 0)) / 60;
    return totalTimeHours * (formData.laborCostPerHour || 0);
  }, [formData.prepTime, formData.cookTime, formData.laborCostPerHour]);

  const calculateOverheadCost = useCallback(() => {
    const ingredientsCost = calculateIngredientsCost();
    return ingredientsCost * ((formData.overheadPercentage || 0) / 100);
  }, [calculateIngredientsCost, formData.overheadPercentage]);

  const calculateTotalCost = useCallback(() => {
    return (
      calculateIngredientsCost() +
      calculateLaborCost() +
      calculateOverheadCost()
    );
  }, [calculateIngredientsCost, calculateLaborCost, calculateOverheadCost]);

  const calculateCostPerServing = useCallback(() => {
    const totalCost = calculateTotalCost();
    return totalCost / Math.max(formData.servings || 1, 1);
  }, [calculateTotalCost, formData.servings]);

  const calculateSuggestedPrice = useCallback(() => {
    const costPerServing = calculateCostPerServing();
    const marginDecimal = (formData.marginPercentage || 0) / 100;

    // Proteção contra margem de 100% (divisão por zero)
    if (marginDecimal >= 1) return 0;

    return costPerServing / (1 - marginDecimal);
  }, [calculateCostPerServing, formData.marginPercentage]);

  const calculateProfit = useCallback(() => {
    return calculateSuggestedPrice() - calculateCostPerServing();
  }, [calculateSuggestedPrice, calculateCostPerServing]);

  const calculateRealMargin = useCallback(() => {
    const suggestedPrice = calculateSuggestedPrice();
    const profit = calculateProfit();

    if (suggestedPrice <= 0) return 0;

    return (profit / suggestedPrice) * 100;
  }, [calculateSuggestedPrice, calculateProfit]);

  // Função para obter análise de viabilidade
  const getViabilityAnalysis = useCallback(() => {
    const costPerServing = calculateCostPerServing();
    const suggestedPrice = calculateSuggestedPrice();
    const realMargin = calculateRealMargin();

    let status: 'high' | 'good' | 'warning' | 'danger' = 'good';
    let message = '';

    if (realMargin >= 40) {
      status = 'high';
      message = 'Margem excelente! Produto muito lucrativo.';
    } else if (realMargin >= 25) {
      status = 'good';
      message = 'Margem boa. Produto viável para venda.';
    } else if (realMargin >= 15) {
      status = 'warning';
      message = 'Margem baixa. Considere revisar custos ou preço.';
    } else {
      status = 'danger';
      message = 'Margem muito baixa. Produto pode não ser viável.';
    }

    return {
      status,
      message,
      costPerServing,
      suggestedPrice,
      realMargin,
    };
  }, [calculateCostPerServing, calculateSuggestedPrice, calculateRealMargin]);

  // Funções para gerenciar rascunhos
  const handleSaveDraft = async () => {
    if (!currentUser) {
      recipeToast.error('Você precisa estar logado para salvar rascunhos');
      return;
    }

    try {
      if (currentDraftId) {
        // Atualizar rascunho existente
        await toastWithLoading(() => updateDraft(currentDraftId, formData), {
          loading: '📝 Atualizando rascunho...',
          success: '✅ Rascunho atualizado com sucesso!',
          error: 'Erro ao atualizar rascunho',
        });
      } else {
        // Criar novo rascunho
        const draftId = await toastWithLoading(() => saveDraft(formData), {
          loading: '💾 Salvando rascunho...',
          success: '✅ Rascunho salvo com sucesso!',
          error: 'Erro ao salvar rascunho',
        });
        setCurrentDraftId(draftId);
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      handleFirebaseError(error);
    }
  };

  const handleLoadDraft = (draftData: RecipeFormData & { id: string }) => {
    setFormData(draftData);
    setCurrentDraftId(draftData.id);
    setShowDraftsModal(false);
    alert('Rascunho carregado com sucesso!');
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Tem certeza que deseja excluir este rascunho?')) {
      return;
    }

    try {
      await deleteDraft(draftId);

      // Se estamos editando este rascunho, limpar o ID
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }

      alert('Rascunho excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir rascunho:', error);
      alert('Erro ao excluir rascunho. Tente novamente.');
    }
  };

  const handleClearForm = () => {
    setShowClearFormModal(true);
  };

  const confirmClearForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'doces' as RecipeCategory,
      servings: 1,
      ingredients: [
        {
          name: '',
          quantity: 0,
          unit: 'g',
          costPerUnit: 0,
          supplier: '',
          notes: '',
        },
      ],
      instructions: [''],
      prepTime: 0,
      cookTime: 0,
      tags: [],
      difficulty: 'fácil',
      marginPercentage: 30,
      laborCostPerHour: 15,
      overheadPercentage: 10,
    });

    setCurrentDraftId(null);
    setErrors([]);
    setShowClearFormModal(false);
    generalToast.success('✅ Formulário limpo com sucesso!');
  };

  // Função para verificar se uma seção tem erros
  const getSectionErrors = (section: string): string[] => {
    const sectionErrors: string[] = [];

    switch (section) {
      case 'basic':
        if (!formData.title.trim()) sectionErrors.push('Título obrigatório');
        if (!formData.category) sectionErrors.push('Categoria obrigatória');
        if (formData.servings <= 0) sectionErrors.push('Porções inválidas');
        break;
      case 'ingredients':
        if (formData.ingredients.length === 0)
          sectionErrors.push('Nenhum ingrediente');
        formData.ingredients.forEach((ing, idx) => {
          if (!ing.name.trim() || ing.quantity <= 0 || ing.costPerUnit <= 0) {
            sectionErrors.push(`Ingrediente ${idx + 1} incompleto`);
          }
        });
        break;
      case 'instructions': {
        const validInsts = formData.instructions.filter(
          (inst) => inst.trim().length > 0
        );
        if (validInsts.length === 0) sectionErrors.push('Nenhuma instrução');
        break;
      }
      case 'pricing':
        if (
          formData.marginPercentage <= 0 ||
          formData.marginPercentage >= 100
        ) {
          sectionErrors.push('Margem inválida');
        }
        break;
    }

    return sectionErrors;
  };

  // Função para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      recipeToast.error('Você precisa estar logado para criar uma receita.');
      setErrors(['Você precisa estar logado para criar uma receita.']);
      return;
    }

    // Validar usando a função do Firestore
    const validation = validateRecipeData(formData);
    if (!validation.isValid) {
      recipeToast.validation();
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Garantir que o usuário tenha um perfil
      await ensureUserProfile();

      // Filtrar instruções vazias
      const cleanedFormData = {
        ...formData,
        instructions: formData.instructions.filter(
          (inst) => inst.trim().length > 0
        ),
      };

      if (isEditMode && editId) {
        // Atualizar receita existente
        const ingredientsCost = calculateIngredientsCost();
        const laborCost = calculateLaborCost();
        const overheadCost = calculateOverheadCost();
        const totalCost = calculateTotalCost();
        const costPerServing = totalCost / cleanedFormData.servings;
        const suggestedPrice = calculateSuggestedPrice();
        const finalPrice = suggestedPrice;
        const profit = finalPrice - costPerServing;
        const profitMargin = totalCost > 0 ? (profit / finalPrice) * 100 : 0;

        const recipeUpdate = {
          title: cleanedFormData.title,
          description: cleanedFormData.description,
          category: cleanedFormData.category,
          servings: cleanedFormData.servings,
          ingredients: cleanedFormData.ingredients.map((ing) => ({
            ...ing,
            id: Math.random().toString(36).substring(2, 9),
          })),
          instructions: cleanedFormData.instructions,
          prepTime: cleanedFormData.prepTime,
          cookTime: cleanedFormData.cookTime,
          totalTime: cleanedFormData.prepTime + cleanedFormData.cookTime,
          costs: {
            totalIngredientsCost: ingredientsCost,
            laborCost,
            overheadCost,
            totalCost,
            costPerServing,
          },
          pricing: {
            marginPercentage: cleanedFormData.marginPercentage,
            suggestedPrice,
            finalPrice,
            profit,
            profitMargin,
          },
          tags: cleanedFormData.tags,
          difficulty: cleanedFormData.difficulty,
          updatedAt: new Date(),
        };

        await toastWithLoading(() => updateRecipe(editId, recipeUpdate), {
          loading: '📝 Atualizando receita...',
          success: '✅ Receita atualizada com sucesso!',
          error: 'Erro ao atualizar receita',
        });

        console.log('✅ Receita atualizada com sucesso! ID:', editId);

        // Redirecionar para a visualização da receita
        navigate(`/receita/${editId}`);
      } else {
        // Criar nova receita
        const recipeId = await toastWithLoading(
          () => createRecipe(cleanedFormData),
          {
            loading: '💾 Salvando receita...',
            success: '✅ Receita criada com sucesso!',
            error: 'Erro ao criar receita',
          }
        );

        console.log('✅ Receita criada com sucesso! ID:', recipeId);

        // Redirecionar para o dashboard após salvar
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar receita:', error);
      handleFirebaseError(error);

      if (error instanceof Error) {
        setErrors([`Erro ao salvar receita: ${error.message}`]);
      } else {
        setErrors(['Erro ao salvar receita. Tente novamente.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Editar Receita' : 'Nova Receita'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Edite sua receita e atualize automaticamente os custos e preços.'
            : 'Crie uma nova receita e calcule automaticamente os custos e preços.'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar
          currentStep={
            activeSection === 'basic'
              ? 1
              : activeSection === 'ingredients'
                ? 2
                : activeSection === 'instructions'
                  ? 3
                  : 4
          }
          totalSteps={4}
          steps={['Básico', 'Ingredientes', 'Instruções', 'Preços']}
          showLabels={false}
        />
      </div>

      {/* Navegação por seções */}
      <div className="mb-8">
        <nav className="flex space-x-4 border-b border-gray-200">
          {[
            { key: 'basic', label: '📋 Informações Básicas' },
            { key: 'ingredients', label: '🥄 Ingredientes' },
            { key: 'instructions', label: '📝 Instruções' },
            { key: 'pricing', label: '� Preços' },
          ].map((section) => {
            const sectionErrors = getSectionErrors(section.key);
            const hasErrors = sectionErrors.length > 0;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`pb-2 px-1 text-sm font-medium transition-colors duration-200 relative ${
                  activeSection === section.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {section.label}
                {hasErrors && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção: Informações Básicas */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📋 Informações Básicas
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Título */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Receita *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Bolo de Chocolate com Cobertura"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                  <span className="text-gray-400 ml-1">(opcional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva sua receita, suas características especiais..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as RecipeCategory,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  {RECIPE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de porções */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Porções *
                </label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      servings: Number(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Tempo de preparo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Preparo (minutos)
                </label>
                <input
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prepTime: Number(e.target.value) || 0,
                    })
                  }
                  min="0"
                  placeholder="Ex: 30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Tempo de cozimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Cozimento (minutos)
                </label>
                <input
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cookTime: Number(e.target.value) || 0,
                    })
                  }
                  min="0"
                  placeholder="Ex: 45"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Dificuldade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dificuldade
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as
                        | 'fácil'
                        | 'médio'
                        | 'difícil',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="fácil">🟢 Fácil</option>
                  <option value="médio">🟡 Médio</option>
                  <option value="difícil">🔴 Difícil</option>
                </select>
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Tags
                </label>
                <TagsInput
                  tags={formData.tags}
                  onChange={(tags: string[]) =>
                    setFormData({ ...formData, tags })
                  }
                  suggestions={[
                    'sem glúten',
                    'vegano',
                    'vegetariano',
                    'sem lactose',
                    'low carb',
                    'fit',
                    'proteico',
                    'light',
                    'gourmet',
                    'caseiro',
                    'rápido',
                    'fácil',
                    'economia',
                    'festa',
                    'café da manhã',
                    'lanche',
                    'sobremesa',
                    'salgado',
                    'doce',
                    'tradicional',
                    'inovador',
                    'saudável',
                    'comfort food',
                    'especial',
                    'criança',
                    'diet',
                    'sem açúcar',
                    'integral',
                    'orgânico',
                    'temperado',
                  ]}
                  placeholder="Ex: sem glúten, vegano, fácil..."
                  maxTags={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tags ajudam a categorizar e encontrar suas receitas mais
                  facilmente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seção: Ingredientes */}
        {activeSection === 'ingredients' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                🥄 Ingredientes
              </h2>
              <div className="text-sm text-gray-500">
                {formData.ingredients.length} ingrediente
                {formData.ingredients.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Lista de ingredientes */}
            <div className="space-y-4 mb-6">
              {formData.ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={index}
                  ingredient={ingredient}
                  index={index}
                  onUpdate={(idx, updatedIngredient) => {
                    const newIngredients = [...formData.ingredients];
                    newIngredients[idx] = updatedIngredient;
                    setFormData({ ...formData, ingredients: newIngredients });
                  }}
                  onRemove={(idx) => {
                    const newIngredients = formData.ingredients.filter(
                      (_, i) => i !== idx
                    );
                    setFormData({ ...formData, ingredients: newIngredients });
                  }}
                  canRemove={formData.ingredients.length > 1}
                  suggestions={ingredientSuggestions}
                />
              ))}
            </div>

            {/* Botão para adicionar ingrediente */}
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  ingredients: [
                    ...formData.ingredients,
                    {
                      name: '',
                      quantity: 0,
                      unit: 'g',
                      costPerUnit: 0,
                      supplier: '',
                      notes: '',
                    },
                  ],
                });
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Adicionar Ingrediente</span>
            </button>

            {/* Resumo de custos dos ingredientes */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                📊 Resumo de Custos dos Ingredientes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formData.ingredients.length}
                  </div>
                  <div className="text-sm text-gray-600">Ingredientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {calculateIngredientsCost().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Custo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    R${' '}
                    {(
                      calculateIngredientsCost() /
                      Math.max(formData.servings || 1, 1)
                    ).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Custo por Porção</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      formData.ingredients.filter(
                        (ing) =>
                          ing.name.trim() &&
                          ing.quantity > 0 &&
                          ing.costPerUnit > 0
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Completos</div>
                </div>
              </div>

              {/* Indicador de progresso dos ingredientes */}
              {formData.ingredients.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Ingredientes completos</span>
                    <span>
                      {
                        formData.ingredients.filter(
                          (ing) =>
                            ing.name.trim() &&
                            ing.quantity > 0 &&
                            ing.costPerUnit > 0
                        ).length
                      }
                      /{formData.ingredients.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(formData.ingredients.filter((ing) => ing.name.trim() && ing.quantity > 0 && ing.costPerUnit > 0).length / formData.ingredients.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção: Instruções */}
        {activeSection === 'instructions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                📝 Instruções de Preparo
              </h2>
              <div className="text-sm text-gray-500">
                {formData.instructions.length} passo
                {formData.instructions.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Lista de instruções */}
            <div className="space-y-4 mb-6">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-4">
                  {/* Número do passo */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  {/* Campo de texto da instrução */}
                  <div className="flex-1">
                    <textarea
                      value={instruction}
                      onChange={(e) => {
                        const newInstructions = [...formData.instructions];
                        newInstructions[index] = e.target.value;
                        setFormData({
                          ...formData,
                          instructions: newInstructions,
                        });
                      }}
                      placeholder={`Descreva o passo ${index + 1} do preparo...`}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                    />
                  </div>

                  {/* Botão para remover instrução */}
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newInstructions = formData.instructions.filter(
                          (_, i) => i !== index
                        );
                        setFormData({
                          ...formData,
                          instructions: newInstructions,
                        });
                      }}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                      title="Remover passo"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Botão para adicionar instrução */}
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  instructions: [...formData.instructions, ''],
                });
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Adicionar Passo</span>
            </button>

            {/* Dicas para instruções */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Dicas para boas instruções:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Seja específico com temperaturas, tempos e quantidades
                </li>
                <li>• Use verbos no imperativo (misture, adicione, asse)</li>
                <li>
                  • Mencione pontos importantes como "até dourar" ou "até formar
                  picos"
                </li>
                <li>
                  • Inclua dicas de como saber quando cada etapa está pronta
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Seção: Configurações de Preço */}
        {activeSection === 'pricing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              💰 Configurações de Preço
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configurações de Custos */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                  💵 Configurações de Custos
                </h3>

                {/* Custo de Mão de Obra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo de Mão de Obra (por hora)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={formData.laborCostPerHour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          laborCostPerHour: Number(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.50"
                      placeholder="15.00"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor por hora de trabalho para calcular custo de mão de
                    obra
                  </p>
                </div>

                {/* Porcentagem de Custos Indiretos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custos Indiretos (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.overheadPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overheadPercentage: Number(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Energia, gás, embalagem e outros custos indiretos
                  </p>
                </div>

                {/* Margem de Lucro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margem de Lucro Desejada (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.marginPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marginPercentage: Number(e.target.value) || 0,
                        })
                      }
                      min="1"
                      max="99"
                      step="1"
                      placeholder="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Margem de lucro que você deseja obter sobre o custo total
                  </p>
                </div>
              </div>

              {/* Simulação de Preços */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                  📊 Simulação de Preços
                </h3>

                {/* Cálculos em tempo real */}
                <div className="space-y-4">
                  {(() => {
                    const ingredientsCost = calculateIngredientsCost();
                    const laborCost = calculateLaborCost();
                    const overheadCost = calculateOverheadCost();
                    const totalCost = calculateTotalCost();
                    const costPerServing = calculateCostPerServing();
                    const suggestedPrice = calculateSuggestedPrice();
                    const profit = calculateProfit();
                    const profitMargin = calculateRealMargin();
                    const totalTimeHours =
                      ((formData.prepTime || 0) + (formData.cookTime || 0)) /
                      60;
                    const viability = getViabilityAnalysis();

                    return (
                      <>
                        {/* Custos Detalhados */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 mb-3">
                            Breakdown de Custos:
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Ingredientes:
                              </span>
                              <span className="font-medium">
                                R$ {ingredientsCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Mão de obra ({totalTimeHours.toFixed(1)}h):
                              </span>
                              <span className="font-medium">
                                R$ {laborCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Custos indiretos:
                              </span>
                              <span className="font-medium">
                                R$ {overheadCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 flex justify-between">
                              <span className="font-medium text-gray-800">
                                Custo Total:
                              </span>
                              <span className="font-bold text-blue-600">
                                R$ {totalCost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Preços Calculados */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              R$ {costPerServing.toFixed(2)}
                            </div>
                            <div className="text-sm text-blue-700">
                              Custo/Porção
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              R$ {suggestedPrice.toFixed(2)}
                            </div>
                            <div className="text-sm text-green-700">
                              Preço Sugerido
                            </div>
                          </div>
                        </div>

                        {/* Lucro e Margem */}
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-purple-600">
                                R$ {profit.toFixed(2)}
                              </div>
                              <div className="text-sm text-purple-700">
                                Lucro/Porção
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-600">
                                {profitMargin.toFixed(1)}%
                              </div>
                              <div className="text-sm text-purple-700">
                                Margem Real
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Análise de Viabilidade */}
                        <div
                          className={`rounded-lg p-4 ${
                            viability.status === 'high'
                              ? 'bg-green-50 border border-green-200'
                              : viability.status === 'good'
                                ? 'bg-blue-50 border border-blue-200'
                                : viability.status === 'warning'
                                  ? 'bg-yellow-50 border border-yellow-200'
                                  : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`text-lg ${
                                viability.status === 'high'
                                  ? 'text-green-600'
                                  : viability.status === 'good'
                                    ? 'text-blue-600'
                                    : viability.status === 'warning'
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                              }`}
                            >
                              {viability.status === 'high'
                                ? '🚀'
                                : viability.status === 'good'
                                  ? '✅'
                                  : viability.status === 'warning'
                                    ? '⚠️'
                                    : '❌'}
                            </span>
                            <h4
                              className={`font-medium ${
                                viability.status === 'high'
                                  ? 'text-green-800'
                                  : viability.status === 'good'
                                    ? 'text-blue-800'
                                    : viability.status === 'warning'
                                      ? 'text-yellow-800'
                                      : 'text-red-800'
                              }`}
                            >
                              Análise de Viabilidade
                            </h4>
                          </div>
                          <p
                            className={`text-sm ${
                              viability.status === 'high'
                                ? 'text-green-700'
                                : viability.status === 'good'
                                  ? 'text-blue-700'
                                  : viability.status === 'warning'
                                    ? 'text-yellow-700'
                                    : 'text-red-700'
                            }`}
                          >
                            {viability.message}
                          </p>
                        </div>

                        {/* Alertas e validações */}
                        <div className="space-y-2">
                          {ingredientsCost === 0 && (
                            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                              <span>⚠️</span>
                              <span>
                                Adicione custos aos ingredientes para calcular
                                preços
                              </span>
                            </div>
                          )}

                          {formData.prepTime === 0 &&
                            formData.cookTime === 0 && (
                              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                                <span>⏱️</span>
                                <span>
                                  Defina tempos de preparo para calcular custo
                                  de mão de obra
                                </span>
                              </div>
                            )}

                          {formData.servings === 0 && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                              <span>❌</span>
                              <span>Número de porções não pode ser zero</span>
                            </div>
                          )}

                          {formData.marginPercentage >= 95 && (
                            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg text-sm">
                              <span>🔥</span>
                              <span>
                                Margem muito alta pode dificultar vendas
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Dicas de Precificação */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                🎯 Dicas de Precificação:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • Considere o tempo total (preparo + cozimento) para o custo
                  de mão de obra
                </li>
                <li>
                  • Inclua custos indiretos como energia, gás, embalagem e
                  limpeza
                </li>
                <li>
                  • Margens típicas: produtos caseiros (25-40%), comerciais
                  (15-30%)
                </li>
                <li>• Teste diferentes margens e compare com concorrentes</li>
              </ul>
            </div>
          </div>
        )}

        {/* Rodapé com botões */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              ← Voltar ao Dashboard
            </button>

            <div className="flex flex-wrap gap-4">
              {/* Botões de ação */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDraftsModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                >
                  📂 Rascunhos
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                >
                  🗑️ Limpar
                </button>
              </div>

              {/* Botões principais */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 btn-animated"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="secondary" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>
                      {currentDraftId
                        ? '💾 Atualizar Rascunho'
                        : '💾 Salvar Rascunho'}
                    </span>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 btn-animated"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>
                      {isEditMode ? '✅ Atualizar Receita' : '✅ Criar Receita'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Exibir erros de validação */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-medium mb-2">
                Corrija os seguintes erros:
              </h3>
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>

      {/* Modal de rascunhos */}
      {showDraftsModal && (
        <DraftsModal
          onClose={() => setShowDraftsModal(false)}
          onLoad={handleLoadDraft}
          onDelete={handleDeleteDraft}
        />
      )}

      {/* Modal de confirmação para limpar formulário */}
      <ConfirmModal
        isOpen={showClearFormModal}
        onClose={() => setShowClearFormModal(false)}
        onConfirm={confirmClearForm}
        title="Limpar Formulário"
        message="Tem certeza que deseja limpar o formulário? Todas as informações não salvas serão perdidas permanentemente."
        confirmText="Sim, limpar"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
};

// Componente do modal de rascunhos
const DraftsModal = ({
  onClose,
  onLoad,
  onDelete,
}: {
  onClose: () => void;
  onLoad: (draftData: RecipeFormData & { id: string }) => void;
  onDelete: (draftId: string) => void;
}) => {
  const [drafts, setDrafts] = useState<
    (RecipeFormData & { id: string; createdAt: Date; updatedAt: Date })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const userDrafts = await getUserDrafts();
        setDrafts(userDrafts);
      } catch (error) {
        console.error('Erro ao carregar rascunhos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDrafts();
  }, []);

  const handleDelete = async (draftId: string) => {
    await onDelete(draftId);
    // Recarregar lista após exclusão
    const userDrafts = await getUserDrafts();
    setDrafts(userDrafts);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            📂 Meus Rascunhos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando rascunhos...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <p className="text-gray-500">Nenhum rascunho encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                Salve um rascunho para vê-lo aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900 truncate flex-1">
                      {draft.title || 'Receita sem título'}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {draft.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {draft.description || 'Sem descrição'}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>{draft.ingredients?.length || 0} ingredientes</span>
                    <span>{draft.servings || 0} porções</span>
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    Atualizado:{' '}
                    {new Date(draft.updatedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(draft.updatedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => onLoad(draft)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      📂 Carregar
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaReceita;
