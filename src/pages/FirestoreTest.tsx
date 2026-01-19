import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  runAllTests,
  testFirestoreConnection,
  generateSampleData,
  testUserProfile,
  testRecipeOperations,
  testDashboardStats,
} from '../services/firestore-test';

const FirestoreTest = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runTest = async (
    testName: string,
    testFunction: () => Promise<void>
  ) => {
    setIsLoading(true);
    addResult(`🚀 Iniciando ${testName}...`);

    try {
      await testFunction();
      addResult(`✅ ${testName} concluído com sucesso!`);
    } catch (error) {
      addResult(
        `❌ Erro em ${testName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🔐 Autenticação Necessária
          </h2>
          <p className="text-yellow-700">
            Você precisa estar logado para testar o Firestore.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Testes do Firestore
        </h1>
        <p className="text-gray-600">
          Use esta página para testar a conectividade e funcionalidades do
          Firestore.
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            <strong>Usuário logado:</strong> {currentUser.email} (
            {currentUser.uid})
          </p>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() =>
            runTest('Teste de Conexão', async () => {
              await testFirestoreConnection();
            })
          }
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-semibold">Testar Conexão</div>
          <div className="text-sm opacity-90">
            Verificar conectividade básica
          </div>
        </button>

        <button
          onClick={() => runTest('Teste de Perfil', testUserProfile)}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">👤</div>
          <div className="font-semibold">Testar Perfil</div>
          <div className="text-sm opacity-90">Criar/ler perfil de usuário</div>
        </button>

        <button
          onClick={() => runTest('Teste de Receitas', testRecipeOperations)}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold">Testar Receitas</div>
          <div className="text-sm opacity-90">Criar e listar receitas</div>
        </button>

        <button
          onClick={() => runTest('Teste de Estatísticas', testDashboardStats)}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Testar Estatísticas</div>
          <div className="text-sm opacity-90">Dashboard stats</div>
        </button>

        <button
          onClick={() => runTest('Gerar Dados de Exemplo', generateSampleData)}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">🎲</div>
          <div className="font-semibold">Dados Exemplo</div>
          <div className="text-sm opacity-90">Criar receitas de teste</div>
        </button>

        <button
          onClick={() => runTest('Todos os Testes', runAllTests)}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors duration-200"
        >
          <div className="text-2xl mb-2">🚀</div>
          <div className="font-semibold">Executar Todos</div>
          <div className="text-sm opacity-90">Bateria completa de testes</div>
        </button>
      </div>

      {/* Controles */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
        >
          🗑️ Limpar Resultados
        </button>

        {isLoading && (
          <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded">
            <div className="animate-spin mr-2">⏳</div>
            Executando teste...
          </div>
        )}
      </div>

      {/* Resultados dos Testes */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📋 Console de Resultados</h3>
          <span className="text-gray-400">
            {testResults.length} linha{testResults.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-1">
          {testResults.length === 0 ? (
            <div className="text-gray-500 italic">
              Nenhum teste executado ainda. Clique em um botão acima para
              começar.
            </div>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`${
                  result.includes('❌')
                    ? 'text-red-400'
                    : result.includes('✅')
                      ? 'text-green-400'
                      : result.includes('⚠️')
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📚 Informações sobre os Testes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              🔍 Teste de Conexão
            </h4>
            <p className="text-sm text-gray-600">
              Verifica se o Firestore está configurado corretamente e se é
              possível conectar-se ao banco de dados.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              👤 Teste de Perfil
            </h4>
            <p className="text-sm text-gray-600">
              Testa a criação e leitura de perfis de usuário, incluindo
              configurações e estatísticas.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              📋 Teste de Receitas
            </h4>
            <p className="text-sm text-gray-600">
              Cria uma receita de teste e verifica os cálculos automáticos de
              custos e preços.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              📊 Teste de Estatísticas
            </h4>
            <p className="text-sm text-gray-600">
              Verifica se as estatísticas do dashboard são calculadas
              corretamente com base nas receitas existentes.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Atenção:</strong> Estes testes criam dados reais no
            Firestore. Use apenas em ambiente de desenvolvimento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirestoreTest;
