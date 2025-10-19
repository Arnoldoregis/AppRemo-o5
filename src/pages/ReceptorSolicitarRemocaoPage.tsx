import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import { usePricing } from '../context/PricingContext';
import Layout from '../components/Layout';
import { ArrowLeft, Upload, Plus, Minus, Building2, User as UserIcon, MapPin, Search, AlertTriangle } from 'lucide-react';
import { Additional, Removal, Address } from '../types';
import { adicionaisDisponiveis } from '../data/pricing';
import { getRegionFromAddress, getSpeciesType, getBillingType } from '../utils/pricingUtils';
import { generateContractPdf } from '../utils/generateContractPdf';
import GenerateContractModal from '../components/modals/GenerateContractModal';
import { generateRemovalCode, generateContractNumber } from '../utils/codeGenerator';

const EMERGENCY_FEE = 50;

const ReceptorSolicitarRemocaoPage: React.FC = () => {
    const { type } = useParams<{ type: 'pf' | 'clinica' }>();
    const isForClinica = type === 'clinica';
    const pageTitle = isForClinica ? "Solicitar Remoção (Clínica)" : "Solicitar Remoção (Pessoa Física)";
    
    const navigate = useNavigate();
    const { user } = useAuth();
    const { removals, addRemoval } = useRemovals();
    const { priceTable, modalities } = usePricing();
    const activeModalities = modalities.filter(m => m.active);

    const [formData, setFormData] = useState({
        // Clinic fields
        clinicName: '',
        clinicCnpj: '',
        clinicPhone: '',
        // Tutor fields
        tutorCpfCnpj: '',
        tutorNome: '',
        tutorContato: '',
        tutorEmail: '',
        // Common fields
        modalidade: '' as Removal['modality'],
        petNome: '',
        petEspecie: '' as Removal['pet']['species'],
        petRaca: '',
        petSexo: '' as Removal['pet']['gender'],
        petPeso: '',
        petCausaMorte: '',
        enderecoCep: '',
        enderecoRua: '',
        enderecoNumero: '',
        enderecoBairro: '',
        enderecoCidade: '',
        enderecoEstado: '',
        formaPagamento: '' as Removal['paymentMethod'],
        contratoNumero: '',
        observacoes: '',
        tipoSolicitacao: 'agora' as Removal['requestType'],
        dataAgendamento: '',
        horarioAgendamento: '',
        motivoAgendamento: ''
    });

    const [adicionais, setAdicionais] = useState<Additional[]>([]);
    const [valorTotal, setValorTotal] = useState(0);
    const [priceBreakdown, setPriceBreakdown] = useState({ base: 0, extras: 0, discount: 0, emergency: 0 });
    const [showUpload, setShowUpload] = useState(false);
    const [showContrato, setShowContrato] = useState(false);
    const [showPagamentoInfo, setShowPagamentoInfo] = useState(false);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [isEmergencyHours, setIsEmergencyHours] = useState(false);
    const [showEmergencyConfirmModal, setShowEmergencyConfirmModal] = useState(false);
    const [baseCausaMorte, setBaseCausaMorte] = useState('');
    const [doencas, setDoencas] = useState<string[]>([]);
    const [isContagious, setIsContagious] = useState(false);
    const [showContagiousWarning, setShowContagiousWarning] = useState(false);
    const [showContractConfirm, setShowContractConfirm] = useState(false);
    const [pendingRemovalData, setPendingRemovalData] = useState<Partial<Removal> | null>(null);

    useEffect(() => {
        const doencasStr = doencas.join(', ');
        const finalCausa = [baseCausaMorte.trim(), doencasStr].filter(Boolean).join(' - ');
        setFormData(prev => ({ ...prev, petCausaMorte: finalCausa }));
    }, [baseCausaMorte, doencas]);

    useEffect(() => {
        const contagiousDiseases = ['Leptospirose', 'Esporotricose'];
        const hasContagious = doencas.some(d => contagiousDiseases.includes(d));
        setIsContagious(hasContagious);

        if (hasContagious) {
            setShowContagiousWarning(true);
            setAdicionais(prev => prev.filter(ad => !['patinha_resina', 'relicario', 'carteirinha_pelinho'].includes(ad.type)));
            
            if (formData.modalidade === 'individual_ouro') {
                setFormData(prev => ({ ...prev, modalidade: 'individual_prata' }));
            }
        } else {
            setShowContagiousWarning(false);
        }
    }, [doencas, formData.modalidade]);

    useEffect(() => {
        const isScheduling = formData.tipoSolicitacao === 'agendar';
        let isEmergency = false;

        if (isScheduling && formData.horarioAgendamento) {
            const hour = parseInt(formData.horarioAgendamento.split(':')[0], 10);
            isEmergency = hour >= 21 || hour < 8;
        } else if (!isScheduling) {
            const now = new Date();
            const currentHour = now.getHours();
            isEmergency = currentHour >= 21 || currentHour < 8;
        }
        
        setIsEmergencyHours(isEmergency);
    }, [formData.tipoSolicitacao, formData.horarioAgendamento]);

    const paymentOptions = isForClinica 
        ? [
            { value: 'faturado', label: 'Faturado' },
            { value: 'debito', label: 'Cartão de Débito' },
            { value: 'credito', label: 'Cartão de Crédito' },
            { value: 'pix', label: 'PIX' },
            { value: 'link_pagamento', label: 'Link de Pagamento' },
            { value: 'dinheiro', label: 'Dinheiro' },
            { value: 'plano_preventivo', label: 'Plano Preventivo' }
          ]
        : [
            { value: 'debito', label: 'Cartão de Débito' },
            { value: 'credito', label: 'Cartão de Crédito' },
            { value: 'pix', label: 'PIX' },
            { value: 'link_pagamento', label: 'Link de Pagamento' },
            { value: 'dinheiro', label: 'Dinheiro' },
            { value: 'plano_preventivo', label: 'Plano Preventivo' }
          ];

    useEffect(() => {
        const calcularValorTotal = () => {
            const currentAddress: Address = {
                cep: formData.enderecoCep,
                street: formData.enderecoRua,
                number: formData.enderecoNumero,
                neighborhood: formData.enderecoBairro,
                city: formData.enderecoCidade,
                state: formData.enderecoEstado,
            };

            const canCalculate = 
                formData.modalidade &&
                formData.petEspecie &&
                formData.petPeso &&
                currentAddress.city &&
                currentAddress.state &&
                formData.formaPagamento;

            if (!canCalculate) {
                setValorTotal(0);
                setPriceBreakdown({ base: 0, extras: 0, discount: 0, emergency: 0 });
                return;
            }

            let valorBase = 0;
            const pesoKey = formData.petPeso;
            const modKey = formData.modalidade;
            
            const region = getRegionFromAddress(currentAddress);
            const speciesType = getSpeciesType(formData.petEspecie);
            const billingType = getBillingType(formData.formaPagamento);

            if (priceTable[region]?.[speciesType]?.[billingType]?.[pesoKey]?.[modKey]) {
                valorBase = priceTable[region][speciesType][billingType][pesoKey][modKey];
            }
            
            const valorAdicionais = adicionais.reduce((total, ad) => total + (ad.value * ad.quantity), 0);
            
            const emergencyFeeValue = isEmergencyHours ? EMERGENCY_FEE : 0;
            let finalTotal = valorBase + valorAdicionais + emergencyFeeValue;
            let patinhaDiscount = 0;

            if (formData.modalidade === 'individual_ouro' && adicionais.some(ad => ad.type === 'patinha_resina' && ad.quantity > 0)) {
                const patinhaPrice = adicionaisDisponiveis.find(ad => ad.type === 'patinha_resina')?.value || 0;
                patinhaDiscount = patinhaPrice;
                finalTotal -= patinhaPrice;
            }

            setValorTotal(finalTotal);
            setPriceBreakdown({ base: valorBase, extras: valorAdicionais, discount: patinhaDiscount, emergency: emergencyFeeValue });
        };
        calcularValorTotal();
    }, [formData.modalidade, formData.petEspecie, formData.petPeso, formData.formaPagamento, adicionais, priceTable, formData.enderecoCep, formData.enderecoCidade, formData.enderecoEstado, isEmergencyHours]);

    useEffect(() => {
        setShowUpload(formData.formaPagamento === 'pix' || formData.formaPagamento === 'link_pagamento');
        setShowContrato(formData.formaPagamento === 'plano_preventivo');
        setShowPagamentoInfo(['credito', 'debito', 'dinheiro'].includes(formData.formaPagamento));
    }, [formData.formaPagamento]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'petCausaMorte') {
            setBaseCausaMorte(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDoencaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setDoencas(prev => {
            if (checked) {
                return [...prev, value];
            } else {
                return prev.filter(d => d !== value);
            }
        });
    };

    const searchCEP = async () => {
        const cep = formData.enderecoCep.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({ ...prev, enderecoRua: data.logradouro, enderecoBairro: data.bairro, enderecoCidade: data.localidade, enderecoEstado: data.uf }));
                }
            } catch (error) { console.error('Erro ao buscar CEP:', error); }
        }
    };

    const handleAdicionalChange = (type: Additional['type'], quantity: number) => {
        if (isContagious && ['patinha_resina', 'relicario', 'carteirinha_pelinho'].includes(type)) {
            return;
        }
        const adicionalInfo = adicionaisDisponiveis.find(a => a.type === type);
        if (!adicionalInfo) return;
        setAdicionais(prev => {
            const existing = prev.find(a => a.type === type);
            if (quantity <= 0) return prev.filter(a => a.type !== type);
            if (existing) return prev.map(a => a.type === type ? { ...a, quantity } : a);
            return [...prev, { type, quantity, value: adicionalInfo.value }];
        });
    };

    const getAdicionalQuantity = (type: string) => adicionais.find(a => a.type === type)?.quantity || 0;

    const handleConfirmAndGenerateContract = () => {
        if (!pendingRemovalData || !user) return;

        const newRemovalCode = generateRemovalCode(removals);
        const newContractNumber = generateContractNumber(removals);

        const finalData = { 
            ...pendingRemovalData, 
            code: newRemovalCode,
            contractNumber: newContractNumber,
            hasContract: true 
        };
        
        generateContractPdf(finalData);
        addRemoval(finalData);

        alert(`Solicitação de remoção criada com sucesso!`);
        navigate('/funcionario/receptor');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const removalData: Partial<Removal> = {
            createdById: user.id,
            clinicName: isForClinica ? formData.clinicName : undefined,
            clinicCnpj: isForClinica ? formData.clinicCnpj : undefined,
            clinicPhone: isForClinica ? formData.clinicPhone : undefined,
            modality: formData.modalidade,
            tutor: { 
                cpfOrCnpj: formData.tutorCpfCnpj, 
                name: formData.tutorNome, 
                phone: formData.tutorContato, 
                email: formData.tutorEmail 
            },
            pet: { name: formData.petNome, species: formData.petEspecie, breed: formData.petRaca, gender: formData.petSexo, weight: formData.petPeso, causeOfDeath: formData.petCausaMorte },
            removalAddress: { cep: formData.enderecoCep, street: formData.enderecoRua, number: formData.enderecoNumero, neighborhood: formData.enderecoBairro, city: formData.enderecoCidade, state: formData.enderecoEstado },
            additionals: adicionais,
            paymentMethod: formData.formaPagamento,
            value: valorTotal,
            observations: formData.observacoes,
            requestType: formData.tipoSolicitacao,
            scheduledDate: formData.dataAgendamento,
            scheduledTime: formData.horarioAgendamento,
            schedulingReason: formData.motivoAgendamento,
            status: formData.tipoSolicitacao === 'agendar' ? 'agendada' : 'solicitada',
            history: [{ date: new Date().toISOString(), action: `Solicitação para ${isForClinica ? `clínica ${formData.clinicName}` : 'pessoa física'} criada pelo Receptor ${user.name}`, user: user.name }],
            contractNumber: formData.contratoNumero,
            paymentProof: paymentProofFile ? paymentProofFile.name : undefined,
            emergencyFee: isEmergencyHours ? EMERGENCY_FEE : undefined,
        };

        setPendingRemovalData(removalData);

        if (formData.tipoSolicitacao === 'agendar' && isEmergencyHours) {
            setShowEmergencyConfirmModal(true);
        } else {
            setShowContractConfirm(true);
        }
    };

    const handleEmergencyConfirm = () => {
        setShowEmergencyConfirmModal(false);
        setShowContractConfirm(true);
    };

    const isPatinhaInclusa = formData.modalidade === 'individual_ouro';

    const renderClinicInputs = () => (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Building2 className="h-5 w-5 mr-2 text-green-600" />Informações da Clínica *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" name="clinicName" value={formData.clinicName} onChange={handleInputChange} placeholder="Nome Fantasia da Clínica" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="clinicCnpj" value={formData.clinicCnpj} onChange={handleInputChange} placeholder="CNPJ da Clínica" required className="w-full px-3 py-2 border rounded-md" />
                <input type="text" name="clinicPhone" value={formData.clinicPhone} onChange={handleInputChange} placeholder="Contato da Clínica" required className="w-full px-3 py-2 border rounded-md md:col-span-2" />
            </div>
        </div>
    );

    const renderFormContent = () => (
        <>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Modalidade *</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeModalities.map((m) => {
                      const isDisabled = isContagious && m.key === 'individual_ouro';
                      return (
                        <label key={m.key} className={`relative cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input type="radio" name="modalidade" value={m.key} checked={formData.modalidade === m.key} onChange={handleInputChange} className="sr-only" required disabled={isDisabled} />
                            <div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.modalidade === m.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${isDisabled ? 'bg-gray-100' : ''}`}>
                            <span className="font-medium">{m.label}</span>
                            </div>
                        </label>
                      );
                    })}
                </div>
            </div>

            {showContagiousWarning && (
                <div className="my-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 flex items-start gap-3">
                    <AlertTriangle className="h-8 w-8 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-lg">Atenção: Doença Contagiosa Detectada</h4>
                        <p className="text-sm mt-1">
                            Por conta da doença contagiosa, a despedida presencial (Plano Ouro) e a confecção de lembranças como Patinha, Relicário e Carteirinha com pelinho não são possíveis.
                            {formData.modalidade === 'individual_prata' && ' O plano foi ajustado automaticamente para Individual Prata.'}
                        </p>
                    </div>
                </div>
            )}
            
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><UserIcon className="h-5 w-5 mr-2 text-blue-600" />Dados do Tutor *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input name="tutorCpfCnpj" value={formData.tutorCpfCnpj} onChange={handleInputChange} placeholder="CPF ou CNPJ" required className="w-full px-3 py-2 border rounded-md" />
                    <input name="tutorNome" value={formData.tutorNome} onChange={handleInputChange} placeholder="Nome do Tutor" required className="w-full px-3 py-2 border rounded-md" />
                    <input name="tutorContato" value={formData.tutorContato} onChange={handleInputChange} placeholder="Número de Contato" required className="w-full px-3 py-2 border rounded-md" />
                    <input type="email" name="tutorEmail" value={formData.tutorEmail} onChange={handleInputChange} placeholder="Email" className="w-full px-3 py-2 border rounded-md" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Pet *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input name="petNome" value={formData.petNome} onChange={handleInputChange} placeholder="Nome do Pet" required className="w-full px-3 py-2 border rounded-md" />
                    <select name="petEspecie" value={formData.petEspecie} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"><option value="">Espécie</option><option value="cachorro">Cachorro</option><option value="gato">Gato</option><option value="roedor">Roedor</option><option value="passaro">Pássaro</option><option value="outros">Outros</option></select>
                    <input name="petRaca" value={formData.petRaca} onChange={handleInputChange} placeholder="Raça" className="w-full px-3 py-2 border rounded-md" />
                    <select name="petSexo" value={formData.petSexo} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"><option value="">Sexo</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select>
                    <select name="petPeso" value={formData.petPeso} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"><option value="">Peso</option><option value="0-5kg">Até 05kg</option><option value="6-10kg">06-10kg</option><option value="11-20kg">11-20kg</option><option value="21-40kg">21-40kg</option><option value="41-50kg">41-50kg</option><option value="51-60kg">51-60kg</option><option value="61-80kg">61-80kg</option></select>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Causa da morte</label>
                        <input
                            type="text"
                            name="petCausaMorte"
                            value={baseCausaMorte}
                            onChange={handleInputChange}
                            placeholder="Descreva a causa da morte"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                <input
                                    type="checkbox"
                                    value="Leptospirose"
                                    onChange={handleDoencaChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Leptospirose
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                <input
                                    type="checkbox"
                                    value="Esporotricose"
                                    onChange={handleDoencaChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Esporotricose
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><MapPin className="h-5 w-5 mr-2 text-red-600" />Endereço da Remoção *</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionais</h3>
                <div className="space-y-4">
                    {adicionaisDisponiveis.map((ad) => {
                      const isForbidden = isContagious && ['patinha_resina', 'relicario', 'carteirinha_pelinho'].includes(ad.type);
                      return (
                        <div key={ad.type} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                            isForbidden ? 'bg-gray-100 opacity-50' : 
                            (isPatinhaInclusa && ad.type === 'patinha_resina' ? 'bg-gray-50 border-green-200' : 'border-gray-200')
                        }`}>
                            <div><span className="font-medium">{ad.label}</span><span className="text-green-600 ml-2">R$ {ad.value},00</span>{isPatinhaInclusa && ad.type === 'patinha_resina' && (<span className="ml-3 text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">1ª Grátis</span>)}</div>
                            <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => handleAdicionalChange(ad.type, Math.max(0, getAdicionalQuantity(ad.type) - 1))} disabled={isForbidden} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-gray-200 disabled:cursor-not-allowed"><Minus className="h-4 w-4" /></button>
                            <span className="w-8 text-center">{getAdicionalQuantity(ad.type)}</span>
                            <button type="button" onClick={() => handleAdicionalChange(ad.type, Math.min(15, getAdicionalQuantity(ad.type) + 1))} disabled={isForbidden} className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:bg-gray-200 disabled:cursor-not-allowed"><Plus className="h-4 w-4" /></button>
                            </div>
                        </div>
                      );
                    })}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Forma de Pagamento *</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentOptions.map((p) => (
                    <label key={p.value} className="relative cursor-pointer">
                        <input type="radio" name="formaPagamento" value={p.value} checked={formData.formaPagamento === p.value} onChange={handleInputChange} className="sr-only" required />
                        <div className={`p-3 rounded-lg border-2 text-center text-sm transition-all ${formData.formaPagamento === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>{p.label}</div>
                    </label>
                    ))}
                </div>
                {showUpload && <div className="mt-4 p-4 bg-yellow-50 rounded-lg"><label className="block text-sm font-medium text-gray-700 mb-2"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input type="file" onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border rounded-md" /></div>}
                {showContrato && <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-2">Número do Contrato</label><input type="text" name="contratoNumero" value={formData.contratoNumero} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" /></div>}
                {showPagamentoInfo && <div className="mt-4 p-4 bg-blue-50 rounded-lg"><p className="text-blue-800 text-sm"><strong>Informação:</strong> O pagamento será realizado no ato da remoção.</p></div>}
            </div>
            
            {isEmergencyHours && formData.tipoSolicitacao === 'agora' && (
              <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Taxa Emergencial</h4>
                  <p className="text-sm">Uma taxa de R$ {EMERGENCY_FEE.toFixed(2)} será adicionada para solicitações entre 21h e 8h.</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Valor Total:</span>
                    {valorTotal > 0 || (priceBreakdown.base === 0 && priceBreakdown.extras > 0) ? (
                        <span className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
                    ) : (
                        <span className="text-sm text-gray-500">Preencha os campos para calcular</span>
                    )}
                </div>
                {valorTotal > 0 && (
                    <details className="text-xs">
                        <summary className="text-blue-600 cursor-pointer select-none font-medium">Ver detalhes do cálculo</summary>
                        <div className="text-sm text-gray-600 mt-2 space-y-1 border-t pt-2">
                            {priceBreakdown.base > 0 && <div className="flex justify-between"><span>Valor Base (Modalidade/Peso/Região):</span><span>R$ {priceBreakdown.base.toFixed(2)}</span></div>}
                            {priceBreakdown.emergency > 0 && <div className="flex justify-between"><span>Taxa Emergencial:</span><span>+ R$ {priceBreakdown.emergency.toFixed(2)}</span></div>}
                            {priceBreakdown.extras > 0 && <div className="flex justify-between"><span>Adicionais:</span><span>+ R$ {priceBreakdown.extras.toFixed(2)}</span></div>}
                            {priceBreakdown.discount > 0 && <div className="flex justify-between text-red-600"><span>Desconto (Patinha Inclusa):</span><span>- R$ {priceBreakdown.discount.toFixed(2)}</span></div>}
                        </div>
                    </details>
                )}
            </div>
            
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Observações</label><textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border rounded-md" placeholder="Informações adicionais..."></textarea></div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Remoção</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer"><input type="radio" name="tipoSolicitacao" value="agora" checked={formData.tipoSolicitacao === 'agora'} onChange={handleInputChange} className="sr-only" /><div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.tipoSolicitacao === 'agora' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><span className="font-medium">Solicitar Agora</span></div></label>
                    <label className="relative cursor-pointer"><input type="radio" name="tipoSolicitacao" value="agendar" checked={formData.tipoSolicitacao === 'agendar'} onChange={handleInputChange} className="sr-only" /><div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.tipoSolicitacao === 'agendar' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><span className="font-medium">Agendar Remoção</span></div></label>
                </div>
                {formData.tipoSolicitacao === 'agendar' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Data</label><input type="date" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Horário</label><input type="time" name="horarioAgendamento" value={formData.horarioAgendamento} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Motivo do Agendamento</label><textarea name="motivoAgendamento" value={formData.motivoAgendamento} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border rounded-md" placeholder="Explique o motivo..."></textarea></div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-4 pt-6"><button type="button" onClick={() => navigate('/funcionario/receptor')} className="px-6 py-2 border rounded-md">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Solicitar</button></div>
        </>
    );

    return (
        <>
        <Layout title={pageTitle}>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/funcionario/receptor')} className="flex items-center text-blue-600 hover:text-blue-800 mb-6"><ArrowLeft className="h-5 w-5 mr-2" />Voltar ao Dashboard</button>
                <div className="bg-white rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {isForClinica && renderClinicInputs()}
                        {renderFormContent()}
                    </form>
                </div>
            </div>
        </Layout>
        {showEmergencyConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmação de Taxa Emergencial</h3>
                        <p className="text-gray-700 mb-6">
                            O horário agendado está entre 21h e 8h. Uma taxa emergencial de R$ {EMERGENCY_FEE.toFixed(2)} será aplicada. Deseja prosseguir com o agendamento?
                        </p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowEmergencyConfirmModal(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
                        <button onClick={handleEmergencyConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Prosseguir</button>
                    </div>
                </div>
            </div>
        )}
        <GenerateContractModal 
            isOpen={showContractConfirm}
            onClose={() => setShowContractConfirm(false)}
            onConfirm={handleConfirmAndGenerateContract}
            removalData={pendingRemovalData}
        />
        </>
    );
};

export default ReceptorSolicitarRemocaoPage;
