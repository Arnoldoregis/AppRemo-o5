import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { faker } from '@faker-js/faker';
import Layout from '../components/Layout';
import { UserCog, Plus, Edit, Trash2, KeyRound } from 'lucide-react';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  const mockFuncionarios = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    userType: 'funcionario' as const,
    role: faker.helpers.arrayElement(['receptor', 'motorista', 'financeiro_junior', 'financeiro_master', 'gerencia']),
    cpf: faker.finance.accountNumber(11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    phone: faker.phone.number(),
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
  })), []);

  return (
    <Layout title="Dashboard do Administrador">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Funcionários</h1>
        <button
          onClick={() => navigate('/funcionario/adm/cadastro-funcionarios')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Cadastrar Novo Funcionário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            <div className="px-4 py-3 font-medium text-sm text-blue-600 flex items-center">
              <UserCog className="h-5 w-5 mr-2" />
              Funcionários ({mockFuncionarios.length})
            </div>
          </nav>
        </div>
        <div className="p-4">
          <UserTable users={mockFuncionarios} />
        </div>
      </div>
    </Layout>
  );
};

interface UserTableProps {
  users: User[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  const handleAction = (action: string, userId: string) => {
    alert(`${action} usuário ${userId}. Funcionalidade a ser implementada.`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.cpf}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex justify-center space-x-2">
                  <button onClick={() => handleAction('Alterar', user.id)} className="text-indigo-600 hover:text-indigo-900" title="Alterar"><Edit className="h-5 w-5"/></button>
                  <button onClick={() => handleAction('Excluir', user.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                  <button onClick={() => handleAction('Resetar senha para', user.id)} className="text-yellow-600 hover:text-yellow-900" title="Resetar Senha"><KeyRound className="h-5 w-5"/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminHome;
