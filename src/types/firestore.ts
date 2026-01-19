// Tipos para o Firestore - Confeitaria App

// ========== TIPOS DE USUÁRIO ==========
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  // Configurações do usuário
  preferences: {
    currency: 'BRL' | 'USD' | 'EUR';
    defaultMarginPercentage: number; // Margem padrão para receitas (ex: 30%)
    roundPrices: boolean; // Arredondar preços para valores inteiros
  };
  // Estatísticas do usuário
  stats: {
    totalRecipes: number;
    averageCost: number;
    averageMargin: number;
    mostProfitableRecipeId?: string;
  };
}

// ========== TIPOS DE INGREDIENTES ==========
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string; // 'g', 'kg', 'ml', 'l', 'unidade', 'xícara', etc.
  costPerUnit: number; // Custo por unidade (ex: R$ 0,50 por 100g)
  supplier?: string; // Fornecedor opcional
  notes?: string; // Observações sobre o ingrediente
}

// ========== TIPOS DE RECEITAS ==========
export interface Recipe {
  id: string;
  userId: string; // ID do usuário que criou a receita
  title: string;
  description?: string;
  category: string; // 'doces', 'salgados', 'bebidas', 'bolos', etc.
  servings: number; // Quantas porções a receita rende

  // Ingredientes da receita
  ingredients: Ingredient[];

  // Instruções de preparo
  instructions: string[];

  // Tempos de preparo
  prepTime: number; // em minutos
  cookTime: number; // em minutos
  totalTime: number; // em minutos

  // Cálculos de custo
  costs: {
    totalIngredientsCost: number; // Custo total dos ingredientes
    laborCost: number; // Custo da mão de obra (baseado no tempo)
    overheadCost: number; // Custos indiretos (energia, gás, etc.)
    totalCost: number; // Custo total da receita
    costPerServing: number; // Custo por porção
  };

  // Cálculos de preço
  pricing: {
    marginPercentage: number; // Margem de lucro desejada
    suggestedPrice: number; // Preço sugerido por porção
    finalPrice: number; // Preço final definido pelo usuário
    profit: number; // Lucro por porção
    profitMargin: number; // Margem de lucro real
  };

  // Tags e classificações
  tags: string[]; // ['vegano', 'sem-glúten', 'natal', etc.]
  difficulty: 'fácil' | 'médio' | 'difícil';

  // Metadados
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // Se a receita está ativa no cardápio
  isFavorite: boolean; // Se é uma receita favorita do usuário

  // Dados opcionais
  imageUrl?: string; // URL da imagem da receita
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };

  // Histórico de vendas (para análises futuras)
  salesHistory?: {
    date: Date;
    quantity: number;
    totalRevenue: number;
  }[];
}

// ========== TIPOS PARA COLEÇÕES ==========
export interface FirestoreCollections {
  users: UserProfile;
  recipes: Recipe;
}

// ========== TIPOS PARA FORMULÁRIOS ==========
export interface RecipeFormData {
  title: string;
  description: string;
  category: string;
  servings: number;
  ingredients: Omit<Ingredient, 'id'>[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  tags: string[];
  difficulty: Recipe['difficulty'];
  marginPercentage: number;
  laborCostPerHour?: number;
  overheadPercentage?: number;
}

// ========== TIPOS PARA ESTATÍSTICAS ==========
export interface DashboardStats {
  totalRecipes: number;
  averageCost: number;
  averageMargin: number;
  mostProfitableRecipe?: {
    id: string;
    title: string;
    profit: number;
  };
  recentRecipes: Pick<Recipe, 'id' | 'title' | 'createdAt'>[];
}

// ========== TIPOS PARA CONFIGURAÇÕES ==========
export interface AppSettings {
  defaultMarginPercentage: number;
  defaultLaborCostPerHour: number;
  defaultOverheadPercentage: number;
  currency: string;
  roundPrices: boolean;
}

// ========== TIPOS PARA VALIDAÇÃO ==========
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ========== CONSTANTES ==========
export const RECIPE_CATEGORIES = [
  'bolos',
  'tortas',
  'doces',
  'salgados',
  'bebidas',
  'pães',
  'biscoitos',
  'sobremesas',
  'outros',
] as const;

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'unidade',
  'xícara',
  'colher (sopa)',
  'colher (chá)',
  'pitada',
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
