import { useState } from 'react';
import { getUserRecipes, createRecipe } from '../services/firestore';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import type { Recipe, RecipeFormData } from '../types/firestore';

interface BackupExportProps {
  className?: string;
}

interface BackupData {
  version: string;
  timestamp: string;
  recipes: Recipe[];
  totalRecipes: number;
}

export const BackupExport = ({ className = '' }: BackupExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Função para exportar receitas em JSON
  const exportRecipes = async () => {
    try {
      setIsExporting(true);
      toast.loading('Preparando backup...', { id: 'export-loading' });

      const recipes = await getUserRecipes();

      if (recipes.length === 0) {
        toast.error('Nenhuma receita encontrada para exportar.');
        return;
      }

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        recipes: recipes,
        totalRecipes: recipes.length,
      };

      // Criar blob e download
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Criar elemento de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `confeitaria-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL
      URL.revokeObjectURL(url);

      // Salvar backup automático no localStorage
      saveToLocalStorage(backupData);

      toast.success(`Backup exportado com ${recipes.length} receitas!`, {
        id: 'export-loading',
      });
    } catch (error) {
      console.error('Erro ao exportar receitas:', error);
      toast.error('Erro ao exportar receitas. Tente novamente.', {
        id: 'export-loading',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Função para importar receitas de JSON
  const importRecipes = async (file: File) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      toast.loading('Importando receitas...', { id: 'import-loading' });

      const text = await file.text();
      let backupData: BackupData;

      try {
        backupData = JSON.parse(text);
      } catch {
        throw new Error(
          'Arquivo JSON inválido. Verifique se o arquivo não está corrompido.'
        );
      }

      // Validar estrutura do backup
      if (!backupData.recipes || !Array.isArray(backupData.recipes)) {
        throw new Error(
          'Arquivo de backup inválido. Estrutura de dados não reconhecida.'
        );
      }

      if (backupData.recipes.length === 0) {
        throw new Error('O arquivo de backup não contém receitas.');
      }

      const { recipes } = backupData;
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];

        try {
          // Validar campos obrigatórios da receita
          if (
            !recipe.title ||
            !recipe.category ||
            !recipe.servings ||
            !recipe.ingredients
          ) {
            throw new Error(`Receita ${i + 1}: Campos obrigatórios faltando`);
          }

          if (
            !Array.isArray(recipe.ingredients) ||
            recipe.ingredients.length === 0
          ) {
            throw new Error(
              `Receita "${recipe.title}": Sem ingredientes válidos`
            );
          }

          // Validar ingredientes
          for (const ing of recipe.ingredients) {
            if (!ing.name || ing.quantity <= 0 || ing.costPerUnit < 0) {
              throw new Error(
                `Receita "${recipe.title}": Ingrediente inválido`
              );
            }
          }

          // Converter receita para formato de formulário
          const formData: RecipeFormData = {
            title: `${recipe.title} (Importado)`,
            description: recipe.description || '',
            category: recipe.category,
            servings: Math.max(1, recipe.servings || 1),
            ingredients: recipe.ingredients.map((ing) => ({
              name: ing.name,
              quantity: Math.max(0.1, ing.quantity || 0.1),
              unit: ing.unit || 'g',
              costPerUnit: Math.max(0, ing.costPerUnit || 0),
              supplier: ing.supplier || '',
              notes: ing.notes || '',
            })),
            instructions: Array.isArray(recipe.instructions)
              ? recipe.instructions
              : [],
            prepTime: Math.max(0, recipe.prepTime || 0),
            cookTime: Math.max(0, recipe.cookTime || 0),
            tags: Array.isArray(recipe.tags) ? recipe.tags : [],
            difficulty: ['fácil', 'médio', 'difícil'].includes(
              recipe.difficulty
            )
              ? recipe.difficulty
              : 'médio',
            marginPercentage: Math.max(
              0,
              Math.min(100, recipe.pricing?.marginPercentage || 30)
            ),
            laborCostPerHour: 20, // Valor padrão
            overheadPercentage: 10, // Valor padrão
          };

          await createRecipe(formData);
          imported++;
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : `Erro desconhecido na receita ${recipe.title || i + 1}`;
          console.error(
            `Erro ao importar receita ${recipe.title || i + 1}:`,
            error
          );
          errors.push(errorMsg);
          skipped++;
        }

        // Atualizar progresso
        setImportProgress(Math.round(((i + 1) / recipes.length) * 100));
      }

      if (imported > 0) {
        toast.success(
          `Importação concluída! ${imported} receitas importadas${skipped > 0 ? `, ${skipped} com erro` : ''}.`,
          { id: 'import-loading' }
        );

        if (errors.length > 0 && errors.length <= 3) {
          // Mostrar até 3 erros específicos
          setTimeout(() => {
            toast.error(
              `Erros encontrados:\n${errors.slice(0, 3).join('\n')}`,
              { duration: 6000 }
            );
          }, 1000);
        }
      } else {
        const errorSummary =
          errors.length > 0
            ? `\n\nPrimeiros erros:\n${errors.slice(0, 3).join('\n')}`
            : '';
        toast.error(`Nenhuma receita foi importada.${errorSummary}`, {
          id: 'import-loading',
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Erro ao importar receitas:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao importar receitas.',
        { id: 'import-loading' }
      );
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Salvar backup automático no localStorage
  const saveToLocalStorage = (backupData: BackupData) => {
    try {
      const key = `confeitaria-backup-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(backupData));

      // Manter apenas os últimos 5 backups
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith('confeitaria-backup-')
      );
      if (keys.length > 5) {
        keys
          .sort()
          .slice(0, keys.length - 5)
          .forEach((oldKey) => {
            localStorage.removeItem(oldKey);
          });
      }
    } catch (error) {
      console.error('Erro ao salvar backup local:', error);
    }
  };

  // Carregar backup do localStorage
  const loadFromLocalStorage = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith('confeitaria-backup-')
      );
      if (keys.length === 0) {
        toast.error('Nenhum backup local encontrado.');
        return;
      }

      // Pegar o backup mais recente
      keys.sort();
      const latestKey = keys[keys.length - 1];
      const backupData = JSON.parse(localStorage.getItem(latestKey) || '');

      const timestamp = new Date(backupData.timestamp).toLocaleString('pt-BR');
      toast.success(
        `Backup local carregado (${timestamp}) - ${backupData.totalRecipes} receitas.`
      );
    } catch (error) {
      console.error('Erro ao carregar backup local:', error);
      toast.error('Erro ao carregar backup local.');
    }
  };

  // Handler para seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é um arquivo JSON
      const isJsonFile =
        file.name.toLowerCase().endsWith('.json') ||
        file.type === 'application/json';

      if (!isJsonFile) {
        toast.error('Por favor, selecione um arquivo JSON válido (.json).');
        return;
      }

      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo permitido: 10MB.');
        return;
      }

      importRecipes(file);
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">💾</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Backup e Export
            </h3>
            <p className="text-sm text-gray-600">
              Exporte suas receitas ou importe de um backup anterior
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">📤 Exportar Receitas</h4>
            <button
              onClick={exportRecipes}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  Exportar JSON
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">
              Baixa um arquivo JSON com todas as suas receitas
            </p>
          </div>

          {/* Import */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">📥 Importar Receitas</h4>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={isImporting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    {importProgress}%
                  </>
                ) : (
                  <>
                    <span className="mr-2">📥</span>
                    Selecionar JSON
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Importa receitas de um arquivo de backup
            </p>
          </div>

          {/* Backup Local */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">💾 Backup Local</h4>
            <button
              onClick={loadFromLocalStorage}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🔄</span>
              Carregar Local
            </button>
            <p className="text-xs text-gray-500">
              Backups automáticos salvos no navegador
            </p>
          </div>
        </div>

        {/* Progresso de importação */}
        {isImporting && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Importando receitas...</span>
              <span>{importProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Informações sobre Backup Automático */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-xl">💡</div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Backup Automático
            </h4>
            <p className="text-sm text-blue-700">
              Sempre que você exporta suas receitas, um backup automático é
              salvo localmente no seu navegador. Mantemos os últimos 5 backups
              para recuperação rápida.
            </p>
          </div>
        </div>
      </div>

      {/* Dicas de Segurança */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-xl">⚠️</div>
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
              Dicas de Segurança
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Faça backups regulares das suas receitas</li>
              <li>
                • Guarde os arquivos JSON em local seguro (nuvem, HD externo)
              </li>
              <li>• Verifique os dados antes de importar backups antigos</li>
              <li>
                • Backups locais são perdidos se limpar dados do navegador
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupExport;
