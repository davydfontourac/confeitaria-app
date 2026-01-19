import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

export const useSEO = ({ title, description }: SEOProps) => {
  useEffect(() => {
    // Atualizar título da página
    if (title) {
      document.title = `${title} | Confeitaria App`;
    }

    // Atualizar meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', description);
        document.head.appendChild(metaDescription);
      }
    }

    // Cleanup function para restaurar título padrão quando componente desmonta
    return () => {
      if (title) {
        document.title =
          'Confeitaria App - Gerencie suas Receitas e Custos de Confeitaria';
      }
    };
  }, [title, description]);
};

export default useSEO;
