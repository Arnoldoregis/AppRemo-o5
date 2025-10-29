import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, Search, Building } from 'lucide-react';
import { formatCNPJ, formatPhone, validateCNPJ, validatePhone } from '../utils/validation';

const RepresentanteCadastrarClinica: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [errors, setErrors] = useState({ cnpj: '', telefone: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cnpj') {
        formattedValue = formatCNPJ(value);
    } else if (name === 'telefone') {
        formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { cnpj: '', telefone: '' };
    let isValid = true;

    if (!validateCNPJ(formData.cnpj)) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos.';
        isValid = false;
    }

    if (!validatePhone(formData.telefone)) {
        newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos.';
        isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const searchCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
        } else { alert('CEP não encontrado.'); }
      } catch (error) { console.error('Erro ao buscar CEP:', error); alert('Erro ao buscar CEP.'); }
    } else { alert('CEP inválido.'); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        alert('Por favor, corrija os campos inválidos.');
        return;
    }
    // Lógica para salvar a nova clínica (mock)
    console.log('Nova clínica cadastrada:', formData);
    alert('Clínica cadastrada com sucesso!');
    navigate('/funcionario/representante');
  };

  return (
    <Layout title="Cadastrar Nova Clínica">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/funcionario/representante')} className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-semibold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para o Dashboard
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Formulário de Cadastro de Clínica</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Building className="h-5 w-5 mr-2 text-blue-600" />Dados da Clínica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome Fantasia" required className="w-full px-3 py-2 border rounded-md" />
                <div>
                  <input name="cnpj" value={formData.cnpj} onChange={handleInputChange} placeholder="CNPJ" required className="w-full px-3 py-2 border rounded-md" />
                  {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
                </div>
                <div>
                  <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" required className="w-full px-3 py-2 border rounded-md" />
                  {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} placeholder="CEP" required className="w-full px-3 py-2 border rounded-md" />
                  <button type="button" onClick={searchCEP} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"><Search className="h-5 w-5" /></button>
                </div>
                <div className="md:col-span-2"><input type="text" name="rua" value={formData.rua} onChange={handleInputChange} placeholder="Rua" required className="w-full px-3 py-2 border rounded-md" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <input type="text" name="numero" value={formData.numero} onChange={handleInputChange} placeholder="Número" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} placeholder="Bairro" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} placeholder="Cidade" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="estado" value={formData.estado} onChange={handleInputChange} placeholder="UF" required maxLength={2} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button type="button" onClick={() => navigate('/funcionario/representante')} className="px-6 py-2 border rounded-md">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Cadastrar Clínica</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RepresentanteCadastrarClinica;
