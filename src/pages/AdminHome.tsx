import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { faker } from '@faker-js/faker';
import Layout from '../components/Layout';
import { Users, Building2, UserCog, Plus, Edit, Trash2, KeyRound } from 'lucide-react';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'pf' | 'clinicas'>('funcionarios');

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

  const mockPessoasFisicas = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    userType: 'pessoa_fisica' as const,
    cpf: faker.finance.accountNumber(11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    phone: faker.phone.number(),
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
  })), []);
  
  const mockClinicas = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email(),
    userType: 'clinica' as const,
    cnpj: faker.finance.accountNumber(14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
    phone: faker.phone.number(),
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
  })), []);

  const tabs = [
    { id: 'funcionarios' as const, label: 'Funcionários', icon: UserCog, data: mockFuncionarios },
    { id: 'pf' as const, label: 'Pessoas Físicas', icon: Users, data: mockPessoasFisicas },
    { id: 'clinicas' as const, label: 'Clínicas', icon: Building2, data: mockClinicas },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'funcionarios':
        return <UserTable users={mockFuncionarios} type="funcionario" />;
      case 'pf':
        return <UserTable users={mockPessoasFisicas} type="pf" />;
      case 'clinicas':
        return <UserTable users={mockClinicas} type="clinica" />;
      default:
        return null;
    }
  };

  return (
    <Layout title="Dashboard do Administrador">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
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
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label} ({tab.data.length})
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          {renderTable()}
        </div>
      </div>
    </Layout>
  );
};

interface UserTableProps {
  users: User[];
  type: 'funcionario' | 'pf' | 'clinica';
}

const UserTable: React.FC<UserTableProps> = ({ users, type }) => {
  const handleAction = (action: string, userId: string) => {
    alert(`${action} usuário ${userId}. Funcionalidade a ser implementada.`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / Razão Social</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            {type === 'funcionario' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>}
            {type !== 'funcionario' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>}
            {type === 'funcionario' && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.cpf || user.cnpj}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
              {type === 'funcionario' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>}
              {type !== 'funcionario' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>}
              {type === 'funcionario' && (
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => handleAction('Alterar', user.id)} className="text-indigo-600 hover:text-indigo-900" title="Alterar"><Edit className="h-5 w-5"/></button>
                    <button onClick={() => handleAction('Excluir', user.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                    <button onClick={() => handleAction('Resetar senha para', user.id)} className="text-yellow-600 hover:text-yellow-900" title="Resetar Senha"><KeyRound className="h-5 w-5"/></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminHome;
