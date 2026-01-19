import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { withFirestoreErrorHandling } from './errorHandler';
import type {
  UserProfile,
  Recipe,
  RecipeFormData,
  DashboardStats,
  ValidationResult,
  Employee,
  EmployeeFormData,
} from '../types/firestore';

// ========== FUNÇÕES DE USUÁRIO ==========

/**
 * Criar perfil do usuário no Firestore
 */
export async function createUserProfile(
  userData: Partial<UserProfile>
): Promise<void> {
  return withFirestoreErrorHandling(
    async () => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);

      const defaultProfile: UserProfile = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || 'Chef',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          currency: 'BRL',
          defaultMarginPercentage: 30,
          roundPrices: true,
        },
        stats: {
          totalRecipes: 0,
          averageCost: 0,
          averageMargin: 0,
        },
        ...userData,
      };

      await setDoc(userRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    { action: 'criar perfil do usuário' }
  );
}

/**
 * Buscar perfil do usuário
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  return withFirestoreErrorHandling(
    async () => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }

      return null;
    },
    { action: 'buscar perfil do usuário' }
  );
}

/**
 * Garantir que o usuário tenha um perfil (cria se não existir)
 */
export async function ensureUserProfile(): Promise<UserProfile> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  // Primeiro tenta buscar o perfil existente
  let profile = await getUserProfile();

  // Se não existe, cria um novo
  if (!profile) {
    console.log('📝 Criando perfil do usuário pela primeira vez...');
    await createUserProfile({});

    // Busca o perfil recém-criado
    profile = await getUserProfile();

    if (!profile) {
      throw new Error('Erro ao criar perfil do usuário');
    }
  }

  return profile;
}

/**
 * Atualizar perfil do usuário
 */
export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  // Garantir que o perfil existe antes de atualizar
  await ensureUserProfile();

  const userRef = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ========== FUNÇÕES DE RECEITAS ==========

/**
 * Criar nova receita
 */
export async function createRecipe(
  recipeData: RecipeFormData
): Promise<string> {
  return withFirestoreErrorHandling(
    async () => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular custos e preços
      const costs = calculateRecipeCosts(recipeData);
      const pricing = calculateRecipePricing(
        costs,
        recipeData.marginPercentage
      );

      const recipe: Omit<Recipe, 'id'> = {
        userId: auth.currentUser.uid,
        title: recipeData.title,
        description: recipeData.description,
        category: recipeData.category,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients.map((ing, index) => ({
          ...ing,
          id: `ing_${index}_${Date.now()}`,
        })),
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        totalTime: recipeData.prepTime + recipeData.cookTime,
        costs,
        pricing,
        tags: recipeData.tags,
        difficulty: recipeData.difficulty,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isFavorite: false,
        assignedEmployeeId: recipeData.assignedEmployeeId,
        assignedEmployeeName: recipeData.assignedEmployeeName,
        assignedEmployeeHourlyRate: recipeData.assignedEmployeeHourlyRate,
      };

      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipe,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Atualizar estatísticas do usuário
      await updateUserStats();

      return docRef.id;
    },
    { action: 'criar receita' }
  );
}

/**
 * Buscar receitas do usuário
 */
export async function getUserRecipes(limitCount = 50): Promise<Recipe[]> {
  return withFirestoreErrorHandling(
    async () => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const q = query(
        collection(db, 'recipes'),
        where('userId', '==', auth.currentUser.uid),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const recipes: Recipe[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recipes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Recipe);
      });

      // Ordenar no cliente
      return recipes.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    },
    { action: 'buscar receitas do usuário' }
  );
}

/**
 * Buscar receita específica
 */
export async function getRecipe(recipeId: string): Promise<Recipe | null> {
  return withFirestoreErrorHandling(
    async () => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const recipeRef = doc(db, 'recipes', recipeId);
      const recipeSnap = await getDoc(recipeRef);

      if (recipeSnap.exists()) {
        const data = recipeSnap.data();

        // Verificar se a receita pertence ao usuário
        if (data.userId !== auth.currentUser.uid) {
          throw new Error('Acesso negado a esta receita');
        }

        return {
          id: recipeSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Recipe;
      }

      return null;
    },
    { action: 'buscar receita', recipeId }
  );
}

/**
 * Atualizar receita
 */
export async function updateRecipe(
  recipeId: string,
  updates: Partial<Recipe>
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const recipeRef = doc(db, 'recipes', recipeId);

  await updateDoc(recipeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Atualizar estatísticas do usuário
  await updateUserStats();
}

/**
 * Deletar receita
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const recipeRef = doc(db, 'recipes', recipeId);
  await deleteDoc(recipeRef);

  // Atualizar estatísticas do usuário
  await updateUserStats();
}

// ========== FUNÇÕES DE ESTATÍSTICAS ==========

/**
 * Buscar estatísticas do dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const recipes = await getUserRecipes();

  if (recipes.length === 0) {
    return {
      totalRecipes: 0,
      averageCost: 0,
      averageMargin: 0,
      recentRecipes: [],
    };
  }

  // Calcular estatísticas
  const totalCost = recipes.reduce(
    (sum, recipe) => sum + recipe.costs.totalCost,
    0
  );
  const totalMargin = recipes.reduce(
    (sum, recipe) => sum + recipe.pricing.profitMargin,
    0
  );

  // Encontrar receita mais lucrativa
  const mostProfitable = recipes.reduce((max, recipe) =>
    recipe.pricing.profit > (max?.pricing.profit || 0) ? recipe : max
  );

  // Receitas recentes (últimas 5)
  const recentRecipes = recipes.slice(0, 5).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    createdAt: recipe.createdAt,
  }));

  return {
    totalRecipes: recipes.length,
    averageCost: totalCost / recipes.length,
    averageMargin: totalMargin / recipes.length,
    mostProfitableRecipe: mostProfitable
      ? {
          id: mostProfitable.id,
          title: mostProfitable.title,
          profit: mostProfitable.pricing.profit,
        }
      : undefined,
    recentRecipes,
  };
}

/**
 * Atualizar estatísticas do usuário
 */
export async function updateUserStats(): Promise<void> {
  if (!auth.currentUser) return;

  try {
    // Garantir que o perfil existe
    await ensureUserProfile();

    const stats = await getDashboardStats();

    await updateUserProfile({
      stats: {
        totalRecipes: stats.totalRecipes,
        averageCost: stats.averageCost,
        averageMargin: stats.averageMargin,
        mostProfitableRecipeId: stats.mostProfitableRecipe?.id,
      },
    });

    console.log('✅ Estatísticas do usuário atualizadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar estatísticas do usuário:', error);
    // Não propagar o erro para não quebrar outras funcionalidades
  }
}

// ========== FUNÇÕES DE CÁLCULO ==========

/**
 * Calcular custos da receita
 */
function calculateRecipeCosts(recipeData: RecipeFormData): Recipe['costs'] {
  const totalIngredientsCost = recipeData.ingredients.reduce(
    (sum, ingredient) => {
      return sum + ingredient.quantity * ingredient.costPerUnit;
    },
    0
  );

  // Custo de mão de obra (baseado no tempo)
  const laborCostPerHour = recipeData.laborCostPerHour || 15; // R$ 15/hora padrão
  const totalTimeHours = (recipeData.prepTime + recipeData.cookTime) / 60;
  const laborCost = totalTimeHours * laborCostPerHour;

  // Custos indiretos (energia, gás, etc.) - porcentagem do custo dos ingredientes
  const overheadPercentage = recipeData.overheadPercentage || 10; // 10% padrão
  const overheadCost = totalIngredientsCost * (overheadPercentage / 100);

  const totalCost = totalIngredientsCost + laborCost + overheadCost;
  const costPerServing = totalCost / recipeData.servings;

  return {
    totalIngredientsCost,
    laborCost,
    overheadCost,
    totalCost,
    costPerServing,
  };
}

/**
 * Calcular preços da receita
 */
function calculateRecipePricing(
  costs: Recipe['costs'],
  marginPercentage: number
): Recipe['pricing'] {
  const suggestedPrice = costs.costPerServing * (1 + marginPercentage / 100);
  const finalPrice = suggestedPrice; // Por padrão, usar o preço sugerido
  const profit = finalPrice - costs.costPerServing;
  const profitMargin =
    costs.costPerServing > 0 ? (profit / costs.costPerServing) * 100 : 0;

  return {
    marginPercentage,
    suggestedPrice,
    finalPrice,
    profit,
    profitMargin,
  };
}

// ========== FUNÇÕES DE VALIDAÇÃO ==========

/**
 * Validar dados da receita
 */
export function validateRecipeData(data: RecipeFormData): ValidationResult {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Título da receita é obrigatório');
  }

  if (!data.category?.trim()) {
    errors.push('Categoria é obrigatória');
  }

  if (!data.servings || data.servings <= 0) {
    errors.push('Número de porções deve ser maior que zero');
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push('Pelo menos um ingrediente é obrigatório');
  }

  if (data.ingredients) {
    data.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name?.trim()) {
        errors.push(`Ingrediente ${index + 1}: Nome é obrigatório`);
      }
      if (!ingredient.quantity || ingredient.quantity <= 0) {
        errors.push(
          `Ingrediente ${index + 1}: Quantidade deve ser maior que zero`
        );
      }
      if (!ingredient.costPerUnit || ingredient.costPerUnit <= 0) {
        errors.push(
          `Ingrediente ${index + 1}: Custo por unidade deve ser maior que zero`
        );
      }
    });
  }

  if (
    !data.marginPercentage ||
    data.marginPercentage <= 0 ||
    data.marginPercentage >= 100
  ) {
    errors.push('Margem de lucro deve estar entre 1% e 99%');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ========== FUNÇÕES DE RASCUNHOS ==========

/**
 * Salvar rascunho de receita
 */
export async function saveDraft(draftData: RecipeFormData): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    console.log('💾 Salvando rascunho para usuário:', currentUser.uid);

    const draftDoc = {
      ...draftData,
      userId: currentUser.uid, // Corrigido: usar userId em vez de authorId
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDraft: true,
    };

    const docRef = await addDoc(collection(db, 'drafts'), draftDoc);
    console.log('✅ Rascunho salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar rascunho:', error);
    console.error('🔍 Detalhes do erro:', {
      code:
        error && typeof error === 'object' && 'code' in error
          ? error.code
          : 'unknown',
      message:
        error && typeof error === 'object' && 'message' in error
          ? error.message
          : String(error),
    });
    throw error;
  }
}

/**
 * Obter rascunhos do usuário
 */
export async function getUserDrafts(
  limitCount = 10
): Promise<
  (RecipeFormData & { id: string; createdAt: Date; updatedAt: Date })[]
> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('❌ getUserDrafts: Usuário não autenticado');
    return [];
  }

  try {
    console.log('🔍 Buscando rascunhos para usuário:', currentUser.uid);

    // Temporariamente sem orderBy para evitar problemas de índice
    const draftsQuery = query(
      collection(db, 'drafts'),
      where('userId', '==', currentUser.uid),
      limit(limitCount)
    );

    console.log('📝 Executando query de rascunhos...');
    const querySnapshot = await getDocs(draftsQuery);

    console.log(
      '✅ Query executada. Rascunhos encontrados:',
      querySnapshot.size
    );

    if (querySnapshot.empty) {
      console.log('📭 Nenhum rascunho encontrado para este usuário');
      return [];
    }

    // Log dos documentos encontrados
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Rascunho ${index + 1}:`, {
        id: doc.id,
        title: data.title || 'Sem título',
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    const drafts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as (RecipeFormData & {
      id: string;
      createdAt: Date;
      updatedAt: Date;
    })[];

    // Ordenar no cliente (do mais recente para o mais antigo)
    const sortedDrafts = drafts.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    console.log('📋 Rascunhos processados e ordenados:', sortedDrafts.length);
    return sortedDrafts;
  } catch (error) {
    console.error('❌ Erro ao buscar rascunhos:', error);
    console.error(
      '🔍 Código do erro:',
      error && typeof error === 'object' && 'code' in error
        ? error.code
        : 'unknown'
    );
    return [];
  }
}

/**
 * Atualizar rascunho existente
 */
export async function updateDraft(
  draftId: string,
  draftData: RecipeFormData
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const draftRef = doc(db, 'drafts', draftId);

    await updateDoc(draftRef, {
      ...draftData,
      updatedAt: Timestamp.now(),
    });

    console.log('Rascunho atualizado:', draftId);
  } catch (error) {
    console.error('Erro ao atualizar rascunho:', error);
    throw error;
  }
}

/**
 * Excluir rascunho
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const draftRef = doc(db, 'drafts', draftId);
    await deleteDoc(draftRef);
    console.log('Rascunho excluído:', draftId);
  } catch (error) {
    console.error('Erro ao excluir rascunho:', error);
    throw error;
  }
}

// ========== FUNÇÕES DE AUTOCOMPLETE ==========

/**
 * Obter ingredientes únicos do usuário para autocomplete
 */
export async function getUserIngredientSuggestions(
  userId?: string
): Promise<string[]> {
  try {
    const currentUser = auth.currentUser;
    const uid = userId || currentUser?.uid;
    if (!uid) return [];

    // Buscar ingredientes de receitas do usuário. Alguns documentos antigos
    // podem ter sido salvos com o campo authorId; mantemos um fallback para
    // não perder sugestões.
    const recipesQuery = query(
      collection(db, 'recipes'),
      where('userId', '==', uid)
    );

    const ingredients = new Set<string>();

    const collectIngredients = (snap: Awaited<ReturnType<typeof getDocs>>) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as {
          ingredients?: Array<{ name?: string }>;
        };
        if (data.ingredients && Array.isArray(data.ingredients)) {
          data.ingredients.forEach((ingredient: { name?: string }) => {
            if (ingredient?.name?.trim()) {
              ingredients.add(ingredient.name.trim().toLowerCase());
            }
          });
        }
      });
    };

    const primarySnapshot = await getDocs(recipesQuery);
    collectIngredients(primarySnapshot);

    // Fallback para coleções antigas que usavam authorId
    if (primarySnapshot.empty) {
      const legacySnapshot = await getDocs(
        query(collection(db, 'recipes'), where('authorId', '==', uid))
      );
      collectIngredients(legacySnapshot);
    }

    // Adicionar ingredientes comuns como fallback
    const commonIngredients = [
      'farinha de trigo',
      'açúcar',
      'ovos',
      'leite',
      'manteiga',
      'sal',
      'fermento',
      'óleo',
      'água',
      'chocolate',
      'baunilha',
      'canela',
      'açúcar mascavo',
      'farinha de rosca',
      'queijo mussarela',
      'presunto',
      'tomate',
      'cebola',
      'alho',
      'azeite',
      'pimentão',
      'cenoura',
      'batata',
      'frango',
      'carne moída',
      'arroz',
      'feijão',
      'macarrão',
      'molho de tomate',
      'cream cheese',
      'iogurte',
    ];

    commonIngredients.forEach((ingredient) => ingredients.add(ingredient));

    return Array.from(ingredients).sort();
  } catch (error) {
    console.error('Erro ao buscar sugestões de ingredientes:', error);
    return [];
  }
}

// ========== FUNÇÕES DE FUNCIONÁRIOS ==========

const calculateEmployeeHourlyRate = (
  monthlySalary: number,
  monthlyHours: number
): number => {
  if (!monthlySalary || !monthlyHours || monthlyHours <= 0) {
    return 0;
  }

  return Number((monthlySalary / monthlyHours).toFixed(2));
};

export async function createEmployee(data: EmployeeFormData): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return withFirestoreErrorHandling(
    async () => {
      const hourlyRate = calculateEmployeeHourlyRate(
        data.monthlySalary,
        data.monthlyHours
      );

      const docRef = await addDoc(collection(db, 'employees'), {
        ...data,
        userId: auth.currentUser!.uid,
        hourlyRate,
        active: data.active ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    },
    { action: 'criar funcionário' }
  );
}

export async function getEmployees(limitCount = 100): Promise<Employee[]> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return withFirestoreErrorHandling(
    async () => {
      const employeesQuery = query(
        collection(db, 'employees'),
        where('userId', '==', auth.currentUser!.uid),
        limit(limitCount)
      );

      const snapshot = await getDocs(employeesQuery);

      const employees: Employee[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          hourlyRate:
            data.hourlyRate ??
            calculateEmployeeHourlyRate(data.monthlySalary, data.monthlyHours),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Employee;
      });

      return employees.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    },
    { action: 'buscar funcionários' }
  );
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<EmployeeFormData>
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return withFirestoreErrorHandling(
    async () => {
      const employeeRef = doc(db, 'employees', employeeId);

      const computedHourlyRate =
        updates.monthlySalary && updates.monthlyHours
          ? calculateEmployeeHourlyRate(
              updates.monthlySalary,
              updates.monthlyHours
            )
          : undefined;

      await updateDoc(employeeRef, {
        ...updates,
        ...(computedHourlyRate !== undefined
          ? { hourlyRate: computedHourlyRate }
          : {}),
        updatedAt: serverTimestamp(),
      });
    },
    { action: 'atualizar funcionário', employeeId }
  );
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return withFirestoreErrorHandling(
    async () => {
      const employeeRef = doc(db, 'employees', employeeId);
      await deleteDoc(employeeRef);
    },
    { action: 'excluir funcionário', employeeId }
  );
}
