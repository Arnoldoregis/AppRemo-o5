import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';

const RegisterFuncionario: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    funcao: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'cpf') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
    } else if (name === 'telefone') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para salvar o novo funcionário
    console.log('Novo funcionário:', { ...formData, senha_padrao: '12345678' });
    alert('Funcionário cadastrado com sucesso! Um email de confirmação foi enviado para redefinição de senha.');
    navigate('/funcionario/administrador');
  };

  return (
    <Layout title="Cadastro de Funcionário">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/funcionario/administrador')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Novo Funcionário</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input type="text" name="nome" required value={formData.nome} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
                <input type="text" name="cpf" required value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                <input type="text" name="telefone" required value={formData.telefone} onChange={handleInputChange} placeholder="(41) 90000-0000" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail (Login) *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Função *</label>
                <select name="funcao" required value={formData.funcao} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Selecione a função</option>
                  <option value="administrador">Administrador</option>
                  <option value="receptor">Receptor</option>
                  <option value="motorista">Motorista</option>
                  <option value="financeiro_junior">Financeiro Junior</option>
                  <option value="financeiro_master">Financeiro Master</option>
                  <option value="gerencia">Gerencia</option>
                  <option value="operacional">Operacional</option>
                  <option value="representante">Representante</option>
                </select>
              </div>

              <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> A senha padrão para o primeiro acesso será <strong>12345678</strong>. O funcionário receberá um e-mail para confirmar a conta e redefinir a senha.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={() => navigate('/funcionario/administrador')} className="px-6 py-2 border rounded-md">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Confirmar Cadastro</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterFuncionario;
