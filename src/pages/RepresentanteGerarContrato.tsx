import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import { useStock } from '../context/StockContext';
import Layout from '../components/Layout';
import { ArrowLeft, Search, User, FileText, Plus, Minus, Trash2, Package, X as XIcon, Upload } from 'lucide-react';
import { Removal, StockItem } from '../types';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { generateContractPdf } from '../utils/generateContractPdf';

interface PetContractDetail {
  id: number;
  nome: string;
  especie: string;
  sexo: string;
  peso: string;
  raca: string;
  modalidade: 'coletivo' | 'individual_prata' | 'individual_ouro' | '';
  valor: string;
  products: { id: string; name: string; price: number }[];
}

const RepresentanteGerarContrato: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addRemoval } = useRemovals();
  const { stock } = useStock();

  const [formData, setFormData] = useState({
    tutorNome: '',
    tutorCpf: '',
    tutorTelefone: '',
    tutorEmail: '',
    enderecoCep: '',
    enderecoRua: '',
    enderecoNumero: '',
    enderecoBairro: '',
    enderecoCidade: '',
    enderecoEstado: '',
    paymentMethod: 'boleto',
    startDate: '',
    observations: '',
  });

  const [pets, setPets] = useState<PetContractDetail[]>([]);
  const [taxaAdesao, setTaxaAdesao] = useState('');
  const [isPetQuantityModalOpen, setIsPetQuantityModalOpen] = useState(false);
  const [petQuantity, setPetQuantity] = useState(1);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  
  const [productSearch, setProductSearch] = useState<{ petId: number | null; term: string }>({ petId: null, term: '' });

  const totalContractValue = useMemo(() => {
    const petsTotal = pets.reduce((total, pet) => {
        const petValue = parseFloat(pet.valor) || 0;
        const productsTotal = pet.products.reduce((prodTotal, prod) => prodTotal + prod.price, 0);
        return total + petValue + productsTotal;
    }, 0);
    const adesao = parseFloat(taxaAdesao) || 0;
    return petsTotal + adesao;
  }, [pets, taxaAdesao]);

  const stockSearchResults = useMemo(() => {
    if (!productSearch.term) return [];
    return stock.filter(item => 
        (item.category === 'material_venda' || item.category === 'sob_encomenda') &&
        (item.name.toLowerCase().includes(productSearch.term.toLowerCase()) || 
         item.trackingCode.toLowerCase().includes(productSearch.term.toLowerCase()))
    );
  }, [stock, productSearch.term]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePetChange = (index: number, field: keyof Omit<PetContractDetail, 'id' | 'products'>, value: string) => {
    setPets(prev => {
      const newPets = [...prev];
      newPets[index] = { ...newPets[index], [field]: value };
      return newPets;
    });
  };
  
  const handleRemovePet = (id: number) => {
    setPets(prev => prev.filter(pet => pet.id !== id));
  };

  const handleConfirmPetQuantity = () => {
    setPets(Array.from({ length: petQuantity }, (_, i) => ({
      id: Date.now() + i,
      nome: '',
      especie: '',
      sexo: '',
      peso: '',
      raca: '',
      modalidade: '',
      valor: '',
      products: [],
    })));
    setIsPetQuantityModalOpen(false);
  };

  const handleAddProductToPet = (petId: number, product: StockItem) => {
    setPets(prev => prev.map(pet => {
        if (pet.id === petId) {
            return { ...pet, products: [...pet.products, { id: product.id, name: product.name, price: product.sellingPrice }] };
        }
        return pet;
    }));
    setProductSearch({ petId: null, term: '' });
  };

  const handleRemoveProductFromPet = (petId: number, productIndex: number) => {
    setPets(prev => prev.map(pet => {
        if (pet.id === petId) {
            const newProducts = [...pet.products];
            newProducts.splice(productIndex, 1);
            return { ...pet, products: newProducts };
        }
        return pet;
    }));
  };

  const searchCEP = async () => {
    const cep = formData.enderecoCep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({ ...prev, enderecoRua: data.logradouro, enderecoBairro: data.bairro, enderecoCidade: data.localidade, enderecoEstado: data.uf }));
        } else { alert('CEP não encontrado.'); }
      } catch (error) { console.error('Erro ao buscar CEP:', error); alert('Erro ao buscar CEP.'); }
    } else { alert('Por favor, digite um CEP válido.'); }
  };

  const handleFinalizeContract = async () => {
    if (!user || pets.length === 0) return;

    let paymentProofData: string | undefined = undefined;
    if (paymentProofFile) {
        paymentProofData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(`${e.target?.result as string}||${paymentProofFile.name}`);
            reader.readAsDataURL(paymentProofFile);
        });
    }

    const newContractData: Partial<Removal> = {
      createdById: user.id,
      tutor: { name: formData.tutorNome, cpfOrCnpj: formData.tutorCpf, phone: formData.tutorTelefone, email: formData.tutorEmail },
      pet: { name: `Contrato Preventivo - ${formData.tutorNome}`, species: 'outros', breed: 'N/A', gender: 'macho', weight: '0-5kg', causeOfDeath: 'N/A' },
      removalAddress: { cep: formData.enderecoCep, street: formData.enderecoRua, number: formData.enderecoNumero, neighborhood: formData.enderecoBairro, city: formData.enderecoCidade, state: formData.enderecoEstado },
      modality: 'plano_preventivo',
      paymentMethod: formData.paymentMethod as Removal['paymentMethod'],
      value: totalContractValue,
      observations: formData.observations,
      status: 'solicitada',
      history: [{ date: new Date().toISOString(), action: `Contrato Preventivo gerado por ${user.name}`, user: user.name }],
      representativeId: user.id,
      representativeName: user.name,
      additionals: [],
      requestType: 'agora',
      paymentProof: paymentProofData,
      preventivePlanDetails: {
        adhesionFee: parseFloat(taxaAdesao) || 0,
        pets: pets.map(p => ({ ...p, valor: parseFloat(p.valor) || 0 })),
      }
    };
    
    const createdContract = addRemoval(newContractData);
    
    generateContractPdf(createdContract);

    alert('Contrato gerado com sucesso!');
    navigate('/funcionario/representante');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pets.length === 0) {
      alert('Por favor, adicione pelo menos um pet ao contrato.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  return (
    <Layout title="Gerar Novo Contrato Preventivo">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/funcionario/representante')} className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-semibold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para o Dashboard
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Formulário de Contrato Preventivo (Pessoa Física)</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><User className="h-5 w-5 mr-2 text-blue-600" />Dados do Tutor Contratante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="tutorNome" value={formData.tutorNome} onChange={handleInputChange} placeholder="Nome Completo" required className="w-full px-3 py-2 border rounded-md" />
                <input name="tutorCpf" value={formData.tutorCpf} onChange={handleInputChange} placeholder="CPF" required className="w-full px-3 py-2 border rounded-md" />
                <input name="tutorTelefone" value={formData.tutorTelefone} onChange={handleInputChange} placeholder="Telefone" required className="w-full px-3 py-2 border rounded-md" />
                <input type="email" name="tutorEmail" value={formData.tutorEmail} onChange={handleInputChange} placeholder="Email" required className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><input type="text" name="enderecoCep" value={formData.enderecoCep} onChange={handleInputChange} placeholder="CEP" required className="w-full px-3 py-2 border rounded-md" /><button type="button" onClick={searchCEP} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"><Search className="h-5 w-5" /></button></div>
                <div className="md:col-span-2"><input type="text" name="enderecoRua" value={formData.enderecoRua} onChange={handleInputChange} placeholder="Rua" required className="w-full px-3 py-2 border rounded-md" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <input type="text" name="enderecoNumero" value={formData.enderecoNumero} onChange={handleInputChange} placeholder="Número" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="enderecoBairro" value={formData.enderecoBairro} onChange={handleInputChange} placeholder="Bairro" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="enderecoCidade" value={formData.enderecoCidade} onChange={handleInputChange} placeholder="Cidade" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="enderecoEstado" value={formData.enderecoEstado} onChange={handleInputChange} placeholder="UF" required maxLength={2} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FileText className="h-5 w-5 mr-2 text-green-600" />Detalhes do Contrato</h3>
              <div className="space-y-4">
                {pets.map((pet, index) => (
                  <div key={pet.id} className="p-4 border rounded-lg bg-gray-50 relative">
                    <button type="button" onClick={() => handleRemovePet(pet.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    <p className="font-semibold mb-3">Pet {index + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <input value={pet.nome} onChange={e => handlePetChange(index, 'nome', e.target.value)} placeholder="Nome do Pet" required className="w-full px-2 py-1.5 border rounded-md text-sm" />
                      <select value={pet.especie} onChange={e => handlePetChange(index, 'especie', e.target.value)} required className="w-full px-2 py-1.5 border rounded-md text-sm"><option value="">Espécie</option><option value="cachorro">Cachorro</option><option value="gato">Gato</option><option value="roedor">Roedor</option><option value="passaro">Pássaro</option><option value="outros">Outros</option></select>
                      <select value={pet.sexo} onChange={e => handlePetChange(index, 'sexo', e.target.value)} required className="w-full px-2 py-1.5 border rounded-md text-sm"><option value="">Sexo</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select>
                      <select value={pet.peso} onChange={e => handlePetChange(index, 'peso', e.target.value)} required className="w-full px-2 py-1.5 border rounded-md text-sm"><option value="">Peso</option><option value="0-5kg">Até 05kg</option><option value="6-10kg">06-10kg</option><option value="11-20kg">11-20kg</option><option value="21-40kg">21-40kg</option><option value="41-50kg">41-50kg</option><option value="51-60kg">51-60kg</option><option value="61-80kg">61-80kg</option></select>
                      <input value={pet.raca} onChange={e => handlePetChange(index, 'raca', e.target.value)} placeholder="Raça" required className="w-full px-2 py-1.5 border rounded-md text-sm" />
                      <select value={pet.modalidade} onChange={e => handlePetChange(index, 'modalidade', e.target.value)} required className="w-full px-2 py-1.5 border rounded-md text-sm"><option value="">Modalidade</option><option value="coletivo">Coletivo</option><option value="individual_prata">Individual Prata</option><option value="individual_ouro">Individual Ouro</option></select>
                      <input type="number" value={pet.valor} onChange={e => handlePetChange(index, 'valor', e.target.value)} placeholder="Valor (R$)" required className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Package size={16}/>Produtos Adicionais</h4>
                      {pet.products.map((prod, prodIndex) => (
                        <div key={prodIndex} className="flex justify-between items-center text-sm bg-white p-2 rounded-md mb-1">
                          <span>{prod.name} - R$ {prod.price.toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemoveProductFromPet(pet.id, prodIndex)} className="text-red-500"><XIcon size={14}/></button>
                        </div>
                      ))}
                      <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar produto por nome/código..."
                            value={productSearch.petId === pet.id ? productSearch.term : ''}
                            onChange={e => setProductSearch({ petId: pet.id, term: e.target.value })}
                            className="w-full text-xs border-gray-300 rounded-md shadow-sm mt-2"
                        />
                        {productSearch.petId === pet.id && stockSearchResults.length > 0 && (
                            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                                {stockSearchResults.map(p => (
                                    <div key={p.id} onClick={() => handleAddProductToPet(pet.id, p)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-gray-500">Cód: {p.trackingCode} | R$ {p.sellingPrice.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setIsPetQuantityModalOpen(true)} className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-lg py-3 hover:bg-gray-50 transition-colors">Adicionar Pet(s)</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Adesão</h3>
                    <input type="number" value={taxaAdesao} onChange={e => setTaxaAdesao(e.target.value)} placeholder="Valor da taxa de adesão (R$)" className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Forma de Pagamento</h3>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md">
                        <option value="boleto">Boleto Mensal</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                        <option value="pix">PIX</option>
                        <option value="link_pagamento">Link de Pagamento</option>
                        <option value="dinheiro">Dinheiro</option>
                    </select>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comprovante de Pagamento</h3>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                        <Upload className="inline h-4 w-4 mr-1" />
                        Anexar Comprovante (Opcional)
                    </label>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
            </div>

            {pets.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-lg font-semibold text-blue-800">Valor Total do Contrato: <span className="font-bold">R$ {totalContractValue.toFixed(2)}</span></p>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
              <textarea name="observations" value={formData.observations} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border rounded-md" placeholder="Informações adicionais sobre o contrato..."></textarea>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button type="button" onClick={() => navigate('/funcionario/representante')} className="px-6 py-2 border rounded-md">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Gerar Contrato</button>
            </div>
          </form>
        </div>
      </div>

      {isPetQuantityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h4 className="font-semibold mb-4 text-center">Qual a quantidade de Pets?</h4>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button type="button" onClick={() => setPetQuantity(q => Math.max(1, q - 1))} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Minus size={20} /></button>
              <span className="text-2xl font-bold w-12 text-center">{petQuantity}</span>
              <button type="button" onClick={() => setPetQuantity(q => q + 1)} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><Plus size={20} /></button>
            </div>
            <div className="flex justify-center gap-4">
                <button type="button" onClick={() => setIsPetQuantityModalOpen(false)} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancelar</button>
                <button type="button" onClick={handleConfirmPetQuantity} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleFinalizeContract}
        title="Gerar Contrato Preventivo"
        message="Tem certeza que deseja gerar o contrato? Um PDF será baixado e a solicitação será enviada para aprovação."
        confirmText="Sim, Gerar Contrato"
      />
    </Layout>
  );
};

export default RepresentanteGerarContrato;
