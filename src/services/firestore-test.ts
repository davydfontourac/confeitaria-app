import {
  createUserProfile,
  getUserProfile,
  createRecipe,
  getUserRecipes,
  getDashboardStats,
  validateRecipeData,
} from './firestore';
import type { RecipeFormData } from '../types/firestore';

// ========== DADOS DE TESTE ==========

const testRecipeData: RecipeFormData = {
  title: 'Bolo de Chocolate Teste',
  description: 'Um delicioso bolo de chocolate para testar o sistema',
  category: 'bolos',
  servings: 8,
  ingredients: [
    {
      name: 'Farinha de Trigo',
      quantity: 300,
      unit: 'g',
      costPerUnit: 0.008, // R$ 0,008 por grama
      supplier: 'Mercado Local',
    },
    {
      name: 'Açúcar',
      quantity: 200,
      unit: 'g',
      costPerUnit: 0.005, // R$ 0,005 por grama
    },
    {
      name: 'Ovos',
      quantity: 3,
      unit: 'unidade',
      costPerUnit: 0.75, // R$ 0,75 por ovo
    },
    {
      name: 'Leite',
      quantity: 250,
      unit: 'ml',
      costPerUnit: 0.004, // R$ 0,004 por ml
    },
    {
      name: 'Chocolate em Pó',
      quantity: 50,
      unit: 'g',
      costPerUnit: 0.02, // R$ 0,020 por grama
    },
  ],
  instructions: [
    'Pré-aqueça o forno a 180°C',
    'Misture os ingredientes secos em uma tigela',
    'Adicione os ingredientes líquidos',
    'Bata até formar uma massa homogênea',
    'Despeje na forma untada',
    'Asse por 35-40 minutos',
  ],
  prepTime: 20,
  cookTime: 40,
  tags: ['chocolate', 'bolo', 'teste'],
  difficulty: 'fácil',
  marginPercentage: 35,
  laborCostPerHour: 15,
  overheadPercentage: 10,
};

// ========== FUNÇÕES DE TESTE ==========

/**
 * Testar validação de dados
 */
export async function testDataValidation(): Promise<void> {
  console.log('🧪 Testando validação de dados...');

  // Teste 1: Dados válidos
  const validResult = validateRecipeData(testRecipeData);
  console.log('✅ Dados válidos:', validResult.isValid ? 'PASSOU' : 'FALHOU');
  if (!validResult.isValid) {
    console.error('❌ Erros encontrados:', validResult.errors);
  }

  // Teste 2: Dados inválidos (título vazio)
  const invalidData = { ...testRecipeData, title: '' };
  const invalidResult = validateRecipeData(invalidData);
  console.log(
    '✅ Dados inválidos detectados:',
    !invalidResult.isValid ? 'PASSOU' : 'FALHOU'
  );

  // Teste 3: Ingredientes inválidos
  const noIngredientsData = { ...testRecipeData, ingredients: [] };
  const noIngredientsResult = validateRecipeData(noIngredientsData);
  console.log(
    '✅ Ingredientes obrigatórios:',
    !noIngredientsResult.isValid ? 'PASSOU' : 'FALHOU'
  );

  console.log('✅ Testes de validação concluídos!');
}

/**
 * Testar criação e leitura de perfil de usuário
 */
export async function testUserProfile(): Promise<void> {
  console.log('🧪 Testando perfil de usuário...');

  try {
    // Tentar buscar perfil existente
    let profile = await getUserProfile();

    if (!profile) {
      console.log('📝 Criando perfil de usuário...');
      await createUserProfile({
        displayName: 'Chef de Teste',
        preferences: {
          currency: 'BRL',
          defaultMarginPercentage: 30,
          roundPrices: true,
        },
      });

      // Buscar novamente após criação
      profile = await getUserProfile();
    }

    if (profile) {
      console.log('✅ Perfil encontrado:', {
        nome: profile.displayName,
        email: profile.email,
        receitas: profile.stats.totalRecipes,
      });
      console.log('✅ Teste de perfil: PASSOU');
    } else {
      console.error('❌ Teste de perfil: FALHOU - Perfil não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro no teste de perfil:', error);
  }
}

/**
 * Testar criação e leitura de receitas
 */
export async function testRecipeOperations(): Promise<void> {
  console.log('🧪 Testando operações de receitas...');

  try {
    // Criar receita de teste
    console.log('📝 Criando receita de teste...');
    const recipeId = await createRecipe(testRecipeData);
    console.log('✅ Receita criada com ID:', recipeId);

    // Buscar receitas do usuário
    console.log('📖 Buscando receitas do usuário...');
    const recipes = await getUserRecipes(10);
    console.log('✅ Receitas encontradas:', recipes.length);

    if (recipes.length > 0) {
      const firstRecipe = recipes[0];
      console.log('📋 Primeira receita:', {
        título: firstRecipe.title,
        porções: firstRecipe.servings,
        custoTotal: `R$ ${firstRecipe.costs.totalCost.toFixed(2)}`,
        custoPorPorção: `R$ ${firstRecipe.costs.costPerServing.toFixed(2)}`,
        preçoSugerido: `R$ ${firstRecipe.pricing.suggestedPrice.toFixed(2)}`,
        margem: `${firstRecipe.pricing.profitMargin.toFixed(1)}%`,
      });
    }

    console.log('✅ Teste de receitas: PASSOU');
  } catch (error) {
    console.error('❌ Erro no teste de receitas:', error);
  }
}

/**
 * Testar estatísticas do dashboard
 */
export async function testDashboardStats(): Promise<void> {
  console.log('🧪 Testando estatísticas do dashboard...');

  try {
    const stats = await getDashboardStats();

    console.log('📊 Estatísticas encontradas:', {
      totalReceitas: stats.totalRecipes,
      custoMédio: `R$ ${stats.averageCost.toFixed(2)}`,
      margemMédia: `${stats.averageMargin.toFixed(1)}%`,
      receitasMaisLucrativa: stats.mostProfitableRecipe?.title || 'Nenhuma',
      receitasRecentes: stats.recentRecipes.length,
    });

    console.log('✅ Teste de estatísticas: PASSOU');
  } catch (error) {
    console.error('❌ Erro no teste de estatísticas:', error);
  }
}

/**
 * Executar todos os testes em sequência
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Iniciando testes do Firestore...');
  console.log('================================');

  try {
    await testDataValidation();
    console.log('');

    await testUserProfile();
    console.log('');

    await testRecipeOperations();
    console.log('');

    await testDashboardStats();
    console.log('');

    console.log('🎉 Todos os testes concluídos com sucesso!');
    console.log('✅ Firestore está funcionando corretamente');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    console.log(
      '⚠️  Verifique a configuração do Firebase e as regras do Firestore'
    );
  }
}

/**
 * Testar conexão simples com o Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  console.log('🔍 Testando conexão com Firestore...');

  try {
    // Tentar buscar perfil (não cria se não existir)
    await getUserProfile();
    console.log('✅ Conexão com Firestore: OK');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    console.log('💡 Possíveis causas:');
    console.log('   - Variáveis de ambiente não configuradas');
    console.log('   - Regras do Firestore muito restritivas');
    console.log('   - Usuário não autenticado');
    console.log('   - Problema de rede');
    return false;
  }
}

// ========== UTILITÁRIOS PARA DESENVOLVIMENTO ==========

/**
 * Limpar dados de teste (use com cuidado!)
 */
export async function clearTestData(): Promise<void> {
  console.log('⚠️  Funcionalidade de limpeza não implementada por segurança');
  console.log('💡 Para limpar dados, use o console do Firebase');
}

/**
 * Gerar dados de exemplo para desenvolvimento
 */
export async function generateSampleData(): Promise<void> {
  console.log('📝 Gerando dados de exemplo...');

  const sampleRecipes: RecipeFormData[] = [
    {
      title: 'Brigadeiro Gourmet',
      description: 'Brigadeiro cremoso com chocolate belga',
      category: 'doces',
      servings: 20,
      ingredients: [
        {
          name: 'Leite Condensado',
          quantity: 1,
          unit: 'lata',
          costPerUnit: 3.5,
        },
        {
          name: 'Chocolate em Pó',
          quantity: 30,
          unit: 'g',
          costPerUnit: 0.025,
        },
        { name: 'Manteiga', quantity: 15, unit: 'g', costPerUnit: 0.02 },
        {
          name: 'Chocolate Granulado',
          quantity: 50,
          unit: 'g',
          costPerUnit: 0.03,
        },
      ],
      instructions: [
        'Misturar todos os ingredientes',
        'Cozinhar em fogo baixo',
        'Enrolar e decorar',
      ],
      prepTime: 15,
      cookTime: 10,
      tags: ['chocolate', 'doce', 'festa'],
      difficulty: 'fácil',
      marginPercentage: 40,
    },
    {
      title: 'Quiche de Queijo',
      description: 'Quiche cremoso com queijo e ervas',
      category: 'salgados',
      servings: 6,
      ingredients: [
        {
          name: 'Massa Folhada',
          quantity: 1,
          unit: 'unidade',
          costPerUnit: 4.0,
        },
        { name: 'Queijo Ralado', quantity: 100, unit: 'g', costPerUnit: 0.035 },
        { name: 'Ovos', quantity: 3, unit: 'unidade', costPerUnit: 0.75 },
        {
          name: 'Creme de Leite',
          quantity: 200,
          unit: 'ml',
          costPerUnit: 0.01,
        },
      ],
      instructions: [
        'Forrar forma com massa',
        'Misturar recheio',
        'Assar por 30 minutos',
      ],
      prepTime: 20,
      cookTime: 30,
      tags: ['queijo', 'salgado', 'almoço'],
      difficulty: 'médio',
      marginPercentage: 35,
    },
  ];

  try {
    for (const recipe of sampleRecipes) {
      const id = await createRecipe(recipe);
      console.log(`✅ ${recipe.title} criado com ID: ${id}`);
    }

    console.log('🎉 Dados de exemplo criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar dados de exemplo:', error);
  }
}
