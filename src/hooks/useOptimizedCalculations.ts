import { useMemo } from 'react';
import type { Ingredient, Recipe } from '../types/firestore';

/**
 * Hook customizado para cálculos de custos de receitas
 * Otimizado com memoização para evitar recálculos desnecessários
 */

interface UseCostCalculationProps {
  ingredients: Omit<Ingredient, 'id'>[];
  servings: number;
  prepTime: number;
  cookTime: number;
  marginPercentage: number;
  laborCostPerHour?: number;
  overheadPercentage?: number;
}

interface CostCalculationResult {
  totalIngredientsCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerServing: number;
  suggestedPrice: number;
  finalPrice: number;
  profit: number;
  profitMargin: number;
  isViable: boolean;
  viabilityLevel: 'excellent' | 'good' | 'warning' | 'critical';
  ingredientsCostBreakdown: {
    ingredient: Omit<Ingredient, 'id'>;
    totalCost: number;
    percentage: number;
  }[];
}

export const useCostCalculation = ({
  ingredients,
  servings,
  prepTime,
  cookTime,
  marginPercentage,
  laborCostPerHour = 20,
  overheadPercentage = 10,
}: UseCostCalculationProps): CostCalculationResult => {
  return useMemo(() => {
    // Cálculo do custo total dos ingredientes
    const totalIngredientsCost = ingredients.reduce(
      (total, ingredient) =>
        total + ingredient.quantity * ingredient.costPerUnit,
      0
    );

    // Cálculo do custo de mão de obra
    const totalTimeInHours = (prepTime + cookTime) / 60;
    const laborCost = totalTimeInHours * laborCostPerHour;

    // Cálculo dos custos indiretos (overhead)
    const overheadCost =
      (totalIngredientsCost + laborCost) * (overheadPercentage / 100);

    // Custo total da receita
    const totalCost = totalIngredientsCost + laborCost + overheadCost;

    // Custo por porção
    const costPerServing = servings > 0 ? totalCost / servings : 0;

    // Cálculo do preço sugerido com margem
    const suggestedPrice = costPerServing * (1 + marginPercentage / 100);

    // Para este exemplo, o preço final é igual ao sugerido
    const finalPrice = suggestedPrice;

    // Cálculo do lucro e margem real
    const profit = finalPrice - costPerServing;
    const profitMargin =
      costPerServing > 0 ? (profit / costPerServing) * 100 : 0;

    // Análise de viabilidade
    let viabilityLevel: CostCalculationResult['viabilityLevel'] = 'critical';
    if (profitMargin >= 40) viabilityLevel = 'excellent';
    else if (profitMargin >= 25) viabilityLevel = 'good';
    else if (profitMargin >= 15) viabilityLevel = 'warning';

    const isViable = profitMargin >= 15;

    // Breakdown dos custos por ingrediente
    const ingredientsCostBreakdown = ingredients
      .map((ingredient) => {
        const ingredientTotalCost =
          ingredient.quantity * ingredient.costPerUnit;
        const percentage =
          totalIngredientsCost > 0
            ? (ingredientTotalCost / totalIngredientsCost) * 100
            : 0;

        return {
          ingredient,
          totalCost: ingredientTotalCost,
          percentage,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost); // Ordenar por custo decrescente

    return {
      totalIngredientsCost,
      laborCost,
      overheadCost,
      totalCost,
      costPerServing,
      suggestedPrice,
      finalPrice,
      profit,
      profitMargin,
      isViable,
      viabilityLevel,
      ingredientsCostBreakdown,
    };
  }, [
    ingredients,
    servings,
    prepTime,
    cookTime,
    marginPercentage,
    laborCostPerHour,
    overheadPercentage,
  ]);
};

/**
 * Hook para estatísticas de receitas otimizado
 */
interface UseRecipeStatsProps {
  recipes: Recipe[];
}

interface RecipeStatsResult {
  totalRecipes: number;
  averageCost: number;
  averageMargin: number;
  totalRevenue: number;
  totalProfit: number;
  mostProfitable: Recipe | null;
  leastProfitable: Recipe | null;
  categoryDistribution: Record<string, number>;
  monthlyTrends: {
    month: string;
    recipes: number;
    totalCost: number;
    totalRevenue: number;
  }[];
}

export const useRecipeStats = ({
  recipes,
}: UseRecipeStatsProps): RecipeStatsResult => {
  return useMemo(() => {
    if (recipes.length === 0) {
      return {
        totalRecipes: 0,
        averageCost: 0,
        averageMargin: 0,
        totalRevenue: 0,
        totalProfit: 0,
        mostProfitable: null,
        leastProfitable: null,
        categoryDistribution: {},
        monthlyTrends: [],
      };
    }

    const totalRecipes = recipes.length;

    // Cálculos básicos
    const totalCost = recipes.reduce(
      (sum, recipe) => sum + recipe.costs.totalCost,
      0
    );
    const totalRevenue = recipes.reduce(
      (sum, recipe) => sum + recipe.pricing.finalPrice,
      0
    );
    const totalProfit = recipes.reduce(
      (sum, recipe) => sum + recipe.pricing.profit,
      0
    );
    const totalMargin = recipes.reduce(
      (sum, recipe) => sum + recipe.pricing.profitMargin,
      0
    );

    const averageCost = totalCost / totalRecipes;
    const averageMargin = totalMargin / totalRecipes;

    // Receitas mais e menos lucrativas
    const mostProfitable = recipes.reduce((max, recipe) =>
      recipe.pricing.profit > max.pricing.profit ? recipe : max
    );

    const leastProfitable = recipes.reduce((min, recipe) =>
      recipe.pricing.profit < min.pricing.profit ? recipe : min
    );

    // Distribuição por categoria
    const categoryDistribution = recipes.reduce(
      (acc, recipe) => {
        acc[recipe.category] = (acc[recipe.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Tendências mensais
    const monthlyMap = new Map<
      string,
      { recipes: number; totalCost: number; totalRevenue: number }
    >();

    recipes.forEach((recipe) => {
      const date = new Date(recipe.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = monthlyMap.get(monthKey) || {
        recipes: 0,
        totalCost: 0,
        totalRevenue: 0,
      };
      current.recipes += 1;
      current.totalCost += recipe.costs.totalCost;
      current.totalRevenue += recipe.pricing.finalPrice;

      monthlyMap.set(monthKey, current);
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRecipes,
      averageCost,
      averageMargin,
      totalRevenue,
      totalProfit,
      mostProfitable,
      leastProfitable,
      categoryDistribution,
      monthlyTrends,
    };
  }, [recipes]);
};

/**
 * Hook para debounce de valores - otimiza performance em inputs
 */
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
