import React, { useMemo, useState } from 'react';
import { Removal, Address, NextTask, Pet } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import { usePricing } from '../context/PricingContext';
import ReceptorActions from './actions/ReceptorActions';
import MotoristaActions from './actions/MotoristaActions';
import FinanceiroJuniorActions from './actions/FinanceiroJuniorActions';
import FinanceiroMasterActions from './actions/FinanceiroMasterActions';
import ClinicaActions from './actions/ClinicaActions';
import OperacionalActions from './actions/OperacionalActions';
import AguardandoRetiradaActions from './actions/AguardandoRetiradaActions';
import ReceptorVendaActions from './actions/ReceptorVendaActions';
import { X, User, Dog, MapPin, DollarSign, FileText, Calendar, Clock, History, Info, MessageSquare, Download, Map, AlertCircle, CheckCircle, Edit, ThumbsUp, Flame, Building, Truck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { downloadFile } from '../utils/downloadFile';
import SetRemovalCode from './shared/SetRemovalCode';
import { getRegionFromAddress, getSpeciesType, getBillingType } from '../utils/pricingUtils';
import { generateContractPdf } from '../utils/generateContractPdf';

interface RemovalDetailsModalProps {
  removal: Removal | null;
  onClose: (nextTask?: NextTask) => void;
  isReadOnly?: boolean;
  viewedRole?: string;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center border-b pb-2">
      <Icon className="h-5 w-5 mr-2 text-blue-600" />
      {title}
    </h3>
    <div className="space-y-2 text-sm text-gray-700">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  value || value === 0 ? <p><strong>{label}:</strong> {value}</p> : null
);

const modalityHighlightConfig: { [key: string]: string } = {
  coletivo: 'bg-green-200 text-green-800 px-2 py-1 rounded',
  individual_prata: 'bg-gray-300 text-gray-800 px-2 py-1 rounded',
  individual_ouro: 'bg-amber-300 text-amber-800 px-2 py-1 rounded',
  plano_preventivo: 'bg-cyan-200 text-cyan-800 px-2 py-1 rounded',
  '': 'bg-gray-200 text-gray-800 px-2 py-1 rounded'
};

const RemovalDetailsModal: React.FC<RemovalDetailsModalProps> = ({ removal, onClose, isReadOnly = false, viewedRole }) => {
  const { user } = useAuth();
  const { updateRemoval } = useRemovals();
  const { priceTable } = usePricing();
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'add' | 'adjust' | 'change_modality' | 'cremation'>('add');

  const getWeightKeyFromRealWeight = (weight: number): keyof typeof priceTable | null => {
    if (weight <= 5) return '0-5kg';
    if (weight <= 10) return '6-10kg';
    if (weight <= 20) return '11-20kg';
    if (weight <= 40) return '21-40kg';
    if (weight <= 50) return '41-50kg';
    if (weight <= 60) return '51-60kg';
    if (weight <= 80) return '61-80kg';
    return null;
  };

  const financialBreakdown = useMemo(() => {
    if (user?.role !== 'financeiro_junior' || !removal) {
      return null;
    }

    const informedWeightKey = removal.pet.weight as keyof typeof priceTable;
    
    const region = getRegionFromAddress(removal.removalAddress);
    const speciesType = getSpeciesType(removal.pet.species as Pet['species']);
    const billingType = getBillingType(removal.paymentMethod);

    const informedBasePrice = priceTable[region]?.[speciesType]?.[billingType]?.[informedWeightKey]?.[removal.modality] || 0;
    
    const emergencyFee = removal.emergencyFee || 0;
    const valorSolicitado = informedBasePrice + emergencyFee;

    const initialAdditionalsValue = removal.additionals?.reduce((sum, ad) => sum + ad.value * ad.quantity, 0) || 0;

    let valorDivergente = 0;
    if (removal.realWeight) {
      const correctWeightKey = getWeightKeyFromRealWeight(removal.realWeight);
      if (correctWeightKey && correctWeightKey !== informedWeightKey) {
        const correctBasePrice = priceTable[region]?.[speciesType]?.[billingType]?.[correctWeightKey]?.[removal.modality] || 0;
        valorDivergente = correctBasePrice - informedBasePrice;
      }
    }

    const customAdditionalsValue = removal.customAdditionals?.reduce((sum, ad) => sum + ad.value, 0) || 0;
    const valorAdicional = customAdditionalsValue + initialAdditionalsValue;
    
    const subTotal = removal.value;

    if (valorDivergente !== 0 || customAdditionalsValue > 0 || emergencyFee > 0) {
        return {
            valorSolicitado,
            valorDivergente,
            valorAdicional,
            subTotal,
            emergencyFee,
        };
    }

    return null;
  }, [user, removal, priceTable]);


  if (!removal) return null;

  const roleToRender = viewedRole || user?.role;
  const isPreventivePlan = removal.modality === 'plano_preventivo';
  const modalTitle = isPreventivePlan ? 'Detalhes do Contrato Preventivo' : 'Detalhes da Remoção';

  const highlightStyle = modalityHighlightConfig[removal.modality] || modalityHighlightConfig[''];

  const canSetCode = !removal.code && !isReadOnly && ['receptor', 'motorista', 'financeiro_junior'].includes(roleToRender || '');

  const handleWhatsAppClick = (phone: string) => {
    const phoneNumber = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}`, '_blank', 'noopener,noreferrer');

    if (user?.role === 'financeiro_junior' && removal && !removal.contactedByFinance) {
      updateRemoval(removal.id, { contactedByFinance: true });
    }
  };

  const handleGpsClick = (address: Address) => {
    const fullAddress = `${address.street}, ${address.number}, ${address.city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  const renderActions = () => {
    if (isReadOnly) return null;

    if (!removal.code && !canSetCode) return null;
    if (!removal.code && canSetCode) return null; // Only show SetRemovalCode component

    if (removal.status === 'aguardando_retirada' && (roleToRender === 'receptor' || roleToRender === 'financeiro_junior')) {
      return <AguardandoRetiradaActions removal={removal} onClose={() => onClose()} />;
    }

    if (user?.userType === 'clinica') {
        return <ClinicaActions removal={removal} onClose={() => onClose()} />;
    }

    switch (roleToRender) {
      case 'receptor':
        if (removal.status === 'aguardando_venda_receptor') {
          return <ReceptorVendaActions 
                    removal={removal} 
                    onClose={() => onClose()} 
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    activeEditTab={activeEditTab}
                    setActiveEditTab={setActiveEditTab}
                  />;
        }
        return <ReceptorActions removal={removal} onClose={() => onClose()} />;
      case 'motorista':
        return <MotoristaActions removal={removal} onClose={onClose} />;
      case 'operacional':
        return <OperacionalActions removal={removal} onClose={() => onClose()} />;
      case 'financeiro_junior':
        return <FinanceiroJuniorActions 
                  removal={removal} 
                  onClose={() => onClose()} 
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  activeEditTab={activeEditTab}
                  setActiveEditTab={setActiveEditTab}
                />;
      case 'financeiro_master':
        if (['aguardando_baixa_master', 'encaminhado_master'].includes(removal.status)) {
          return <FinanceiroMasterActions removal={removal} onClose={() => onClose()} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {modalTitle} -{' '}
              <span className={highlightStyle}>
                {removal.code || <span className="text-yellow-600">Código Pendente</span>}
              </span>
            </h2>
            {removal.hasContract && (
                <button
                    onClick={() => generateContractPdf(removal)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors"
                >
                    <Download size={12} />
                    Contrato
                </button>
            )}
          </div>
          <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <div className="overflow-y-auto p-6">
          {removal.isPriority && user?.role === 'motorista' && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-r-lg">
              <h3 className="font-bold text-lg flex items-center">
                <AlertTriangle className="h-6 w-6 mr-3" />
                ATENÇÃO: REMOÇÃO PRIORITÁRIA!
              </h3>
              {removal.priorityDeadline && (
                <p className="mt-2 text-base">
                  Chegar ao local até às <strong className="text-xl">{removal.priorityDeadline}</strong>.
                </p>
              )}
            </div>
          )}

          {canSetCode && <SetRemovalCode removal={removal} />}

          <DetailSection title="Informações Gerais" icon={Info}>
            <DetailItem label="Status" value={removal.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
            <div className="flex items-center justify-between">
                <p><strong>Modalidade:</strong> <span className={highlightStyle}>{removal.modality.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></p>
                {user?.role === 'financeiro_junior' && removal.status === 'aguardando_financeiro_junior' && !isReadOnly && !isPreventivePlan && (
                  <button
                    onClick={() => {
                      setActiveEditTab('change_modality');
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full hover:bg-yellow-600 transition-colors"
                  >
                    <Edit size={14} />
                    Alterar Modalidade
                  </button>
                )}
            </div>
            <DetailItem label="Data da Solicitação" value={format(new Date(removal.createdAt), 'dd/MM/yyyy HH:mm')} />
            {!isPreventivePlan && <DetailItem label="Motorista Atribuído" value={removal.assignedDriver?.name} />}
            {isPreventivePlan && <DetailItem label="Representante" value={removal.representativeName} />}
          </DetailSection>

          {isPreventivePlan && removal.preventivePlanDetails && (
            <DetailSection title="Detalhes do Plano Preventivo" icon={FileText}>
                <DetailItem label="Quantidade de Pets" value={removal.preventivePlanDetails.pets.length} />
                <div className="space-y-4 mt-4">
                    {removal.preventivePlanDetails.pets.map((pet, index) => (
                        <div key={pet.id || index} className="p-3 bg-gray-50 border rounded-lg">
                            <p className="font-semibold text-gray-800 mb-2">Pet {index + 1}: {pet.nome}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <DetailItem label="Espécie" value={pet.especie} />
                                <DetailItem label="Sexo" value={pet.sexo} />
                                <DetailItem label="Raça" value={pet.raca} />
                                <DetailItem label="Peso" value={pet.peso} />
                                <DetailItem label="Modalidade" value={pet.modalidade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                                <DetailItem label="Valor do Pet" value={`R$ ${pet.valor.toFixed(2)}`} />
                                <div className="col-span-2">
                                    <DetailItem label="Produtos Adicionais" value={pet.products.map(p => p.name).join(', ') || 'Nenhum'} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DetailSection>
          )}

          {removal.clinicName && (
            <DetailSection title="Dados da Clínica" icon={Building}>
              <DetailItem label="Nome Fantasia" value={removal.clinicName} />
              <DetailItem label="CNPJ" value={removal.clinicCnpj} />
              <DetailItem label="Contato da Clínica" value={removal.clinicPhone} />
            </DetailSection>
          )}

          <DetailSection title="Dados do Tutor" icon={User}>
            <p><strong>Nome:</strong> <span className={highlightStyle}>{removal.tutor.name}</span></p>
            <DetailItem label="CPF/CNPJ" value={removal.tutor.cpfOrCnpj} />
            <div className="flex items-center justify-between">
                <DetailItem label="Contato" value={removal.tutor.phone} />
                {user?.userType === 'funcionario' && removal.tutor.phone && !isReadOnly && (
                    <button
                        onClick={() => handleWhatsAppClick(removal.tutor.phone)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 transition-colors"
                    >
                        <MessageSquare size={14} />
                        Entrar em contato
                    </button>
                )}
            </div>
            <DetailItem label="Email" value={removal.tutor.email} />
          </DetailSection>

          <DetailSection title="Dados do Pet" icon={Dog}>
            {!isPreventivePlan ? (
              <>
                <p><strong>Nome:</strong> <span className={highlightStyle}>{removal.pet.name}</span></p>
                <DetailItem label="Espécie" value={removal.pet.species} />
                <DetailItem label="Raça" value={removal.pet.breed} />
                <DetailItem label="Sexo" value={removal.pet.gender} />
                <DetailItem label="Peso (solicitado)" value={removal.pet.weight} />
                <DetailItem label="Peso (real)" value={removal.realWeight ? `${removal.realWeight} kg` : 'N/A'} />
                <DetailItem label="Causa da Morte" value={removal.pet.causeOfDeath} />
              </>
            ) : (
              <p className="text-sm text-gray-500">Detalhes dos pets estão listados na seção "Detalhes do Plano Preventivo".</p>
            )}
          </DetailSection>

          {(removal.petCondition || removal.farewellSchedulingInfo) && (
            <DetailSection title="Detalhes Operacionais" icon={Info}>
              {removal.petCondition && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Condição do Pet:</p>
                  <blockquote className={`p-3 rounded-md border-l-4 ${user?.role === 'financeiro_junior' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-gray-50 border-gray-300'}`}>
                    {removal.petCondition}
                  </blockquote>
                </div>
              )}
              {removal.farewellSchedulingInfo && (
                <div className="space-y-1 mt-3">
                  <p className="font-semibold text-gray-600">Informações para Agendamento de Despedida:</p>
                  <blockquote className={`p-3 rounded-md border-l-4 ${user?.role === 'financeiro_junior' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-gray-50 border-gray-300'}`}>
                    {removal.farewellSchedulingInfo}
                  </blockquote>
                </div>
              )}
            </DetailSection>
          )}

          <DetailSection title="Dados da Remoção" icon={MapPin}>
            <div className="flex items-start justify-between">
                <p><strong>Endereço:</strong> {`${removal.removalAddress.street}, ${removal.removalAddress.number} - ${removal.removalAddress.neighborhood}, ${removal.removalAddress.city} - ${removal.removalAddress.state}`}</p>
                {user?.role === 'motorista' && !isReadOnly && (
                    <button
                        onClick={() => handleGpsClick(removal.removalAddress)}
                        className="flex-shrink-0 ml-4 flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
                    >
                        <Map size={14} />
                        Ir até o local
                    </button>
                )}
            </div>
          </DetailSection>

          {removal.requestType === 'agendar' && (
            <DetailSection title="Agendamento" icon={Calendar}>
                <DetailItem label="Data Agendada" value={removal.scheduledDate ? format(new Date(removal.scheduledDate), 'dd/MM/yyyy') : 'N/A'} />
                <DetailItem label="Horário Agendado" value={removal.scheduledTime} />
                <DetailItem label="Motivo" value={removal.schedulingReason} />
            </DetailSection>
          )}

          <DetailSection title="Financeiro" icon={DollarSign}>
            {isPreventivePlan && removal.preventivePlanDetails ? (
                <>
                    <DetailItem label="Taxa de Adesão" value={`R$ ${removal.preventivePlanDetails.adhesionFee.toFixed(2)}`} />
                    <p className="font-bold mt-4">Valor Total do Contrato: R$ {removal.value.toFixed(2)}</p>
                    <DetailItem label="Forma de Pagamento" value={removal.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                    {removal.paymentProof && (
                        <div className="mt-2">
                            <button
                                onClick={() => {
                                    const parts = removal.paymentProof!.split('||');
                                    const url = parts[0];
                                    const name = parts.length > 1 ? parts[1] : 'comprovante';
                                    downloadFile(url, name);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 transition-colors"
                            >
                                <Download size={14} />
                                Baixar Comprovante
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <DetailItem label="Forma de Pagamento" value={removal.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                    
                    {removal.paymentMethod === 'plano_preventivo' && (
                    <DetailItem label="Número do Contrato" value={removal.contractNumber} />
                    )}

                    {(removal.paymentMethod === 'pix' || removal.paymentMethod === 'link_pagamento') && removal.paymentProof && (
                    <div className="mt-2">
                        <button
                            onClick={() => {
                                const parts = removal.paymentProof!.split('||');
                                const url = parts[0];
                                const name = parts.length > 1 ? parts[1] : 'comprovante';
                                downloadFile(url, name);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 transition-colors"
                        >
                            <Download size={14} />
                            Baixar Comprovante ({removal.paymentMethod.toUpperCase()})
                        </button>
                    </div>
                    )}
                    
                    {financialBreakdown ? (
                        <div className="mt-4 pt-4 border-t">
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Valor Base (Modalidade/Peso)</span>
                                    <span>R$ {(financialBreakdown.valorSolicitado - financialBreakdown.emergencyFee).toFixed(2)}</span>
                                </div>
                                {financialBreakdown.emergencyFee > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Taxa Emergencial</span>
                                        <span>+ R$ {financialBreakdown.emergencyFee.toFixed(2)}</span>
                                    </div>
                                )}
                                {financialBreakdown.valorDivergente !== 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center">
                                        Valor Divergente
                                        <span className="text-xs text-gray-500 ml-1">(diferença de peso)</span>
                                        {removal.adjustmentConfirmed && (
                                            <ThumbsUp className="h-4 w-4 ml-2 text-green-500" title="Valor divergente confirmado" />
                                        )}
                                        </span>
                                        <span className={financialBreakdown.valorDivergente > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {financialBreakdown.valorDivergente > 0 ? '+' : '-'} R$ {Math.abs(financialBreakdown.valorDivergente).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {financialBreakdown.valorAdicional > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Valor Adicional</span>
                                            <span>+ R$ {financialBreakdown.valorAdicional.toFixed(2)}</span>
                                        </div>
                                        {(removal.additionals.length > 0 || (removal.customAdditionals && removal.customAdditionals.length > 0)) && (
                                            <ul className="text-xs text-gray-600 pl-5">
                                                {removal.additionals.map(ad => (
                                                    <li key={ad.type} className="flex justify-between">
                                                        <span>- {ad.quantity}x {ad.type.replace(/_/g, ' ')}</span>
                                                        <span>R$ {(ad.value * ad.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                                {removal.customAdditionals?.map(ad => {
                                                    const proofParts = ad.paymentProof?.split('||');
                                                    const proofUrl = proofParts?.[0];
                                                    const proofName = proofParts?.[1];

                                                    return (
                                                        <li key={ad.id} className="flex justify-between items-center">
                                                            <span>- {ad.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span>R$ {ad.value.toFixed(2)}</span>
                                                                {proofUrl && proofName && (
                                                                    <button
                                                                        onClick={() => downloadFile(proofUrl, proofName)}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title={`Baixar comprovante: ${proofName}`}
                                                                    >
                                                                        <Download size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t font-bold flex justify-between text-lg">
                                <span>Sub Total</span>
                                <span>R$ {financialBreakdown.subTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : (
                    <>
                        {removal.emergencyFee && (
                            <DetailItem label="Taxa Emergencial" value={`R$ ${removal.emergencyFee.toFixed(2)}`} />
                        )}
                        {removal.additionals.length > 0 && (
                        <div className="mt-2">
                            <strong>Adicionais (solicitação):</strong>
                            <ul className="list-disc list-inside ml-4">
                            {removal.additionals.map(ad => (
                                <li key={ad.type}>{ad.quantity}x {ad.type.replace(/_/g, ' ')} (R$ {(ad.value * ad.quantity).toFixed(2)})</li>
                            ))}
                            </ul>
                        </div>
                        )}
                        {removal.customAdditionals && removal.customAdditionals.length > 0 && (
                        <div className="mt-2">
                            <strong>Adicionais (pós-remoção):</strong>
                            <ul className="list-disc list-inside ml-4">
                            {removal.customAdditionals.map(ad => (
                                <li key={ad.id} className="flex items-center justify-between">
                                <span>{ad.name} (R$ {ad.value.toFixed(2)})</span>
                                {ad.paymentProof && (
                                    <button
                                        onClick={() => {
                                            const parts = ad.paymentProof!.split('||');
                                            const url = parts[0];
                                            const name = parts.length > 1 ? parts[1] : 'comprovante';
                                            downloadFile(url, name);
                                        }}
                                        className="ml-4 text-xs text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <Download size={12} />
                                        Baixar Comprovante
                                    </button>
                                )}
                                </li>
                            ))}
                            </ul>
                        </div>
                        )}
                        <p className="font-bold mt-4">Valor Total: R$ {removal.value.toFixed(2)}</p>
                    </>
                    )}
                </>
            )}
          </DetailSection>

          <DetailSection title="Dados da Cremação" icon={Flame}>
            <DetailItem label="Empresa de Cremação" value={removal.cremationCompany} />
            <DetailItem label="Data da Cremação" value={removal.cremationDate ? format(new Date(removal.cremationDate), 'dd/MM/yyyy') : 'Não definida'} />
            <DetailItem label="Observações para o Certificado" value={removal.certificateObservations} />
          </DetailSection>

          {['aguardando_retirada', 'entrega_agendada'].includes(removal.status) && (
            <DetailSection title="Entrega / Retirada" icon={Truck}>
                {removal.status === 'aguardando_retirada' && (
                    <p className="font-semibold text-orange-600">O tutor virá buscar na unidade.</p>
                )}
                {removal.status === 'entrega_agendada' && removal.scheduledDeliveryDate && (
                    <>
                        <p className="font-semibold text-cyan-600">
                            Entrega agendada para: {format(new Date(removal.scheduledDeliveryDate + 'T00:00:00'), 'dd/MM/yyyy')}
                        </p>
                        <DetailItem 
                            label="Endereço de Entrega" 
                            value={
                                `${(removal.deliveryAddress || removal.removalAddress).street}, ${(removal.deliveryAddress || removal.removalAddress).number} - ${(removal.deliveryAddress || removal.removalAddress).neighborhood}, ${(removal.deliveryAddress || removal.removalAddress).city}`
                            } 
                        />
                    </>
                )}
            </DetailSection>
          )}
          
          <DetailSection title="Outras Informações" icon={FileText}>
             <DetailItem label="Observações" value={removal.observations} />
             <DetailItem label="Motivo do Cancelamento" value={removal.cancellationReason} />
          </DetailSection>

          <DetailSection title="Histórico de Alterações" icon={History}>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {removal.history.map((item, index) => {
                const actionText = item.action;
                const isCremationDateAction = actionText.includes('data de cremação');
                const isCancellationAction = actionText.toLowerCase().includes('cancelada') && item.reason;

                return (
                  <li key={index} className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className={`font-semibold ${isCremationDateAction || isCancellationAction ? 'text-red-600' : ''}`}>{actionText}</span> em {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                      {item.reason && <p className={`text-xs pl-1 ${isCancellationAction ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Motivo: {item.reason}</p>}
                      {item.proofUrl && (
                          <button
                              onClick={() => {
                                  const parts = item.proofUrl!.split('||');
                                  const url = parts[0];
                                  const name = parts.length > 1 ? parts[1] : 'comprovante';
                                  downloadFile(url, name);
                              }}
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                              <Download size={12} />
                              Baixar Comprovante Associado
                          </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </DetailSection>
        </div>
        
        <div className={`sticky bottom-0 bg-gray-50 border-t ${(isEditing && (roleToRender === 'financeiro_junior' || roleToRender === 'receptor')) ? 'h-96' : 'p-4 flex justify-end items-center gap-4'}`}>
            {renderActions()}
            {!(isEditing && (roleToRender === 'financeiro_junior' || roleToRender === 'receptor')) && <button onClick={() => onClose()} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>}
        </div>
      </div>
    </div>
  );
};

export default RemovalDetailsModal;
