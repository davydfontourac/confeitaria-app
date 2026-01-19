import { type FormEvent, useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSEO } from '../hooks/useSEO';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '../services/firestore';
import { generalToast, handleFirebaseError } from '../services/toast';
import type { Employee, EmployeeFormData } from '../types/firestore';

const defaultForm: EmployeeFormData = {
  name: '',
  role: '',
  monthlySalary: 0,
  monthlyHours: 0,
  notes: '',
  active: true,
};

const Funcionarios = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<EmployeeFormData>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useSEO({
    title: 'Funcionários',
    description:
      'Gerencie funcionários, salários mensais e calcule automaticamente o valor por hora.',
  });

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };

  const computeHourly = (salary: number, hours: number): number => {
    if (!salary || !hours || hours <= 0) return 0;
    return Number((salary / hours).toFixed(2));
  };

  const loadEmployees = async () => {
    try {
      setIsLoadingList(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      generalToast.error('Informe o nome do funcionário');
      return;
    }

    if (!formData.monthlySalary || formData.monthlySalary <= 0) {
      generalToast.error('Salário mensal deve ser maior que zero');
      return;
    }

    if (!formData.monthlyHours || formData.monthlyHours <= 0) {
      generalToast.error('Horas trabalhadas no mês devem ser maiores que zero');
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        await updateEmployee(editingId, formData);
        generalToast.success('Funcionário atualizado com sucesso');
      } else {
        await createEmployee(formData);
        generalToast.success('Funcionário criado com sucesso');
      }

      resetForm();
      await loadEmployees();
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      role: employee.role,
      monthlySalary: employee.monthlySalary,
      monthlyHours: employee.monthlyHours,
      notes: employee.notes,
      active: employee.active,
    });
  };

  const handleDelete = async (employeeId: string) => {
    const confirmed = window.confirm('Deseja remover este funcionário?');
    if (!confirmed) return;

    try {
      await deleteEmployee(employeeId);
      generalToast.success('Funcionário removido com sucesso');
      await loadEmployees();
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              👥 Funcionários
            </h1>
            <p className="text-gray-600 text-sm">
              Cadastre salários e horas mensais para calcular o valor por hora
              automaticamente.
            </p>
          </div>
          {isLoadingList && <LoadingSpinner />}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função / Cargo
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Confeiteira, Auxiliar"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salário mensal (R$) *
                </label>
                <input
                  type="number"
                  value={formData.monthlySalary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlySalary: Number(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas trabalhadas / mês *
                </label>
                <input
                  type="number"
                  value={formData.monthlyHours}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyHours: Number(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Trabalha apenas meio período"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="employee-active"
                type="checkbox"
                checked={Boolean(formData.active)}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="employee-active"
                className="text-sm text-gray-700"
              >
                Funcionário ativo
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {isSaving
                  ? 'Salvando...'
                  : editingId
                    ? 'Atualizar'
                    : 'Adicionar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Pré-visualização
            </h2>
            <p className="text-sm text-gray-700">
              Valor por hora estimado:{' '}
              <span className="font-semibold text-blue-600">
                R${' '}
                {computeHourly(
                  formData.monthlySalary,
                  formData.monthlyHours
                ).toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              O valor é calculado dividindo o salário mensal pelo total de horas
              trabalhadas no mês.
            </p>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Equipe cadastrada
          </h2>
          <span className="text-sm text-gray-500">
            {employees.length} {employees.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>

        {isLoadingList ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            Nenhum funcionário cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Salário (R$)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Horas / mês
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Valor por hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {employee.name}
                      {employee.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          {employee.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {employee.role || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      R$ {employee.monthlySalary.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {employee.monthlyHours}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      R${' '}
                      {employee.hourlyRate?.toFixed(2) ||
                        computeHourly(
                          employee.monthlySalary,
                          employee.monthlyHours
                        ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          employee.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {employee.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Funcionarios;
