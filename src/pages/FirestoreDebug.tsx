import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../services/firebase';
import { getUserDrafts } from '../services/firestore';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const FirestoreDebug = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setTestResults((prev) => [...prev, message]);
  };

  const runConnectivityTest = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addLog('🔍 === DIAGNÓSTICO DO FIRESTORE ===');

      // 1. Verificar configuração do Firebase
      addLog(`📊 Projeto ID: ${auth.app.options.projectId}`);
      addLog(`🌐 Auth Domain: ${auth.app.options.authDomain}`);

      // 2. Verificar estado da autenticação
      if (currentUser) {
        addLog(`✅ Usuário autenticado: ${currentUser.uid}`);
        addLog(` Email: ${currentUser.email}`);
        addLog(`👤 Nome: ${currentUser.displayName || 'Não definido'}`);
        addLog(
          `✉️ Email verificado: ${currentUser.emailVerified ? 'Sim' : 'Não'}`
        );
      } else {
        addLog('❌ Nenhum usuário autenticado');
        return;
      }

      // 3. Testar leitura básica do Firestore
      addLog('🔍 Testando conectividade com Firestore...');

      try {
        // Tentar ler um documento que pode não existir (teste de conectividade)
        const testRef = doc(db, 'test', 'connectivity');
        await getDoc(testRef);
        addLog('✅ Conectividade com Firestore: OK');
      } catch (error) {
        addLog(`❌ Erro de conectividade: ${error}`);
        throw error;
      }

      // 4. Testar permissões de leitura na coleção users
      addLog('🔍 Testando permissões na coleção users...');
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          addLog('✅ Perfil do usuário encontrado no Firestore');
          addLog(
            `📄 Dados do perfil: ${JSON.stringify(userSnap.data(), null, 2)}`
          );
        } else {
          addLog('⚠️ Perfil do usuário não encontrado (primeira vez?)');
        }
      } catch (error) {
        addLog(`❌ Erro ao acessar perfil do usuário: ${error}`);
        if (error && typeof error === 'object' && 'code' in error) {
          addLog(`📝 Código do erro: ${error.code}`);
        }
      }

      // 5. Testar permissões de escrita (criar documento de teste)
      addLog('🔍 Testando permissões de escrita...');
      try {
        const testCollection = collection(db, 'debug_tests');
        const testDoc = await addDoc(testCollection, {
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
          message: 'Teste de conectividade',
        });
        addLog(`✅ Documento de teste criado: ${testDoc.id}`);
      } catch (error) {
        addLog(`❌ Erro ao criar documento de teste: ${error}`);
        if (error && typeof error === 'object' && 'code' in error) {
          addLog(`📝 Código do erro: ${error.code}`);
        }
      }

      // 6. Verificar token de autenticação
      addLog('🔍 Verificando token de autenticação...');
      try {
        const token = await currentUser.getIdToken();
        addLog(
          `✅ Token de autenticação válido (${token.substring(0, 20)}...)`
        );

        const tokenResult = await currentUser.getIdTokenResult();
        addLog(`⏰ Token expira em: ${new Date(tokenResult.expirationTime)}`);
        addLog(`🔐 Provedor: ${tokenResult.signInProvider}`);
      } catch (error) {
        addLog(`❌ Erro ao obter token: ${error}`);
      }

      // 7. Testar busca de rascunhos
      addLog('🔍 Testando busca de rascunhos...');
      try {
        const drafts = await getUserDrafts();
        addLog(`✅ Busca de rascunhos bem-sucedida`);
        addLog(`📝 Rascunhos encontrados: ${drafts.length}`);

        if (drafts.length > 0) {
          drafts.forEach((draft, index) => {
            addLog(
              `📄 Rascunho ${index + 1}: "${draft.title || 'Sem título'}" (ID: ${draft.id})`
            );
          });
        } else {
          addLog('📭 Nenhum rascunho encontrado');
        }
      } catch (error) {
        addLog(`❌ Erro ao buscar rascunhos: ${error}`);
        if (error && typeof error === 'object' && 'code' in error) {
          addLog(`📝 Código do erro: ${error.code}`);
        }
      }

      addLog('✅ === DIAGNÓSTICO CONCLUÍDO ===');
    } catch (error) {
      addLog(`❌ Erro geral no diagnóstico: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Diagnóstico do Firestore
          </h1>

          <div className="mb-6">
            <button
              onClick={runConnectivityTest}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Executando testes...' : ' Executar Diagnóstico'}
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500">
                Clique em "Executar Diagnóstico" para começar os testes...
              </div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-800 mb-2">
              💡 Como interpretar os resultados:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • <strong>Conectividade OK:</strong> Firebase está acessível
              </li>
              <li>
                • <strong>Perfil encontrado:</strong> Usuário tem dados no
                Firestore
              </li>
              <li>
                • <strong>Token válido:</strong> Autenticação está funcionando
              </li>
              <li>
                • <strong>Erros de permissão:</strong> Verificar regras do
                Firestore
              </li>
              <li>
                • <strong>Erros de conectividade:</strong> Verificar
                configuração do projeto
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreDebug;
