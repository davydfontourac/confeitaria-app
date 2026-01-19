import React from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { MobileOptimized } from '../components/MobileOptimized';

/**
 * Página dedicada para coleta de feedback
 * Acessível via /feedback durante a fase de testes
 */
const FeedbackPage: React.FC = () => {
  return (
    <MobileOptimized className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <FeedbackForm />

        {/* Informações sobre o projeto */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Sobre o Projeto
          </h2>
          <div className="prose text-gray-600">
            <p>
              O <strong>WebApp Confeitaria</strong> é uma ferramenta completa
              para gestão de confeitaria, desenvolvida em React + TypeScript +
              Firebase.
            </p>

            <h3 className="font-semibold mt-4 mb-2">
              🎯 Funcionalidades Principais:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Gestão de Receitas:</strong> CRUD completo com
                validações
              </li>
              <li>
                <strong>Cálculos Inteligentes:</strong> Custos, margens e
                precificação automática
              </li>
              <li>
                <strong>Dashboard Analytics:</strong> Gráficos de lucratividade
                com Chart.js
              </li>
              <li>
                <strong>Sistema de Backup:</strong> Export/import JSON completo
              </li>
              <li>
                <strong>Mobile-First:</strong> Componentes otimizados para touch
              </li>
              <li>
                <strong>Tratamento de Erros:</strong> Retry automático e
                mensagens amigáveis
              </li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">🚀 Tecnologias:</h3>
            <p className="text-sm">
              React 19, TypeScript, Tailwind CSS, Firebase Auth/Firestore,
              Chart.js, Vite, React Router, React Hot Toast
            </p>

            <h3 className="font-semibold mt-4 mb-2">📱 O que Testar:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Registrar nova conta e fazer login</li>
              <li>Criar receita com ingredientes e cálculos</li>
              <li>Visualizar dashboard com gráficos</li>
              <li>Testar responsividade em mobile</li>
              <li>Experimentar backup/export</li>
              <li>Verificar tratamento de erros</li>
            </ol>
          </div>
        </div>

        {/* Debug Info para Desenvolvimento */}
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">🛠️ Info de Debug</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Build:</strong>{' '}
              {import.meta.env.VITE_APP_ENV || 'development'}
            </p>
            <p>
              <strong>Firebase Project:</strong>{' '}
              {import.meta.env.VITE_FIREBASE_PROJECT_ID}
            </p>
            <p>
              <strong>Deploy:</strong> {window.location.hostname}
            </p>
            <p>
              <strong>User Agent:</strong>{' '}
              {navigator.userAgent.includes('Mobile')
                ? '📱 Mobile'
                : '🖥️ Desktop'}
            </p>
          </div>
        </div>
      </div>
    </MobileOptimized>
  );
};

export default FeedbackPage;
