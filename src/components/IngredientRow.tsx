import { useState, memo, useCallback } from 'react';
import type { Ingredient, Unit } from '../types/firestore';
import AutocompleteInput from './AutocompleteInput';

interface IngredientRowProps {
  ingredient: Omit<Ingredient, 'id'>;
  index: number;
  onUpdate: (index: number, ingredient: Omit<Ingredient, 'id'>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  suggestions?: string[];
}

const IngredientRow = ({
  ingredient,
  index,
  onUpdate,
  onRemove,
  canRemove,
  suggestions = [],
}: IngredientRowProps) => {
  const [errors, setErrors] = useState<string[]>([]);

  // Unidades disponíveis
  const units: Unit[] = [
    'g',
    'kg',
    'ml',
    'l',
    'unidade',
    'xícara',
    'colher (sopa)',
    'colher (chá)',
    'pitada',
  ];

  const validateField = (field: string, value: string | number) => {
    const newErrors: string[] = [];

    switch (field) {
      case 'name':
        if (
          !value ||
          (typeof value === 'string' && value.trim().length === 0)
        ) {
          newErrors.push('Nome do ingrediente é obrigatório');
        }
        break;
      case 'quantity':
        if (!value || Number(value) <= 0) {
          newErrors.push('Quantidade deve ser maior que zero');
        }
        break;
      case 'costPerUnit':
        if (!value || Number(value) <= 0) {
          newErrors.push('Custo por unidade deve ser maior que zero');
        }
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleChange = useCallback(
    (field: keyof Omit<Ingredient, 'id'>, value: string | number) => {
      const updatedIngredient = {
        ...ingredient,
        [field]:
          field === 'quantity' || field === 'costPerUnit'
            ? Number(value) || 0
            : value,
      };

      onUpdate(index, updatedIngredient);

      // Validar o campo alterado
      if (field === 'name' || field === 'quantity' || field === 'costPerUnit') {
        validateField(field, value);
      }
    },
    [ingredient, index, onUpdate]
  );

  const totalCost = ingredient.quantity * ingredient.costPerUnit;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Header da linha com índice e botão remover */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-gray-700">
            Ingrediente {index + 1}
          </span>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
            title="Remover ingrediente"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Grid responsivo com campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nome do ingrediente */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Ingrediente *
          </label>
          <AutocompleteInput
            value={ingredient.name}
            onChange={(value) => handleChange('name', value)}
            suggestions={suggestions}
            placeholder="Ex: Farinha de Trigo"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade *
          </label>
          <input
            type="number"
            value={ingredient.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        {/* Unidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidade *
          </label>
          <select
            value={ingredient.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          >
            <option value="">Selecione...</option>
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Segunda linha do grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Custo por unidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo por {ingredient.unit || 'unidade'} *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="number"
              value={ingredient.costPerUnit || ''}
              onChange={(e) => handleChange('costPerUnit', e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Fornecedor (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fornecedor
            <span className="text-gray-400 ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={ingredient.supplier || ''}
            onChange={(e) => handleChange('supplier', e.target.value)}
            placeholder="Ex: Mercado Local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        {/* Custo total calculado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo Total
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <span className="text-lg font-semibold text-green-600">
              R$ {totalCost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="flex items-end">
          <div className="text-sm text-gray-500">
            {ingredient.quantity > 0 && ingredient.costPerUnit > 0 && (
              <>
                {ingredient.quantity} {ingredient.unit} × R${' '}
                {ingredient.costPerUnit.toFixed(2)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Campo de observações */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
          <span className="text-gray-400 ml-1">(opcional)</span>
        </label>
        <input
          type="text"
          value={ingredient.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Ex: Usar farinha especial, marca específica..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        />
      </div>

      {/* Exibir erros de validação */}
      {errors.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          {errors.map((error, idx) => (
            <p key={idx} className="text-red-600 text-sm">
              • {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(IngredientRow);
