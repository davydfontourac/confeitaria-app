import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRecipe } from '../services/firestore';

const EditarReceita: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!id || !currentUser) {
        setError('ID da receita ou usuário não encontrado');
        setLoading(false);
        return;
      }

      try {
        const recipeData = await getRecipe(id);

        if (!recipeData) {
          setError('Receita não encontrada');
          setLoading(false);
          return;
        }

        // Verificar se o usuário tem permissão para editar
        if (recipeData.userId !== currentUser.uid) {
          setError('Você não tem permissão para editar esta receita');
          setLoading(false);
          return;
        }

        // Se chegou até aqui, tem permissão - redirecionar para nova receita com query params
        navigate(`/nova-receita?edit=${id}`);
      } catch (err) {
        console.error('Erro ao carregar receita:', err);
        setError('Erro ao carregar receita');
        setLoading(false);
      }
    };

    checkPermission();
  }, [id, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/minhas-receitas')}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Voltar para Minhas Receitas
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EditarReceita;
