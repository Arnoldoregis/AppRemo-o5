import React, { useState, useEffect } from 'react';
import { Removal, CustomAdditional, RemovalStatus } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { useAgenda } from '../../context/AgendaContext';
import { usePricing } from '../../context/PricingContext';
import { CheckCircle, Edit, Upload, Plus, Trash2, Save, Flame, Minus, Undo, Building, Award, MessageSquare, Send } from 'lucide-react';
import { collectiveAdditionals } from '../../data/pricing';
import CertificateModal from '../modals/CertificateModal';
import CremationDataModal from '../modals/CremationDataModal';

interface FinanceiroJuniorActionsProps {
  removal: Removal;
  onClose: () => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  activeEditTab: 'add' | 'adjust' | 'change_modality' | 'cremation';
  setActiveEditTab: (tab: 'add' | 'adjust' | 'change_modality' | 'cremation') => void;
}

const FinanceiroJuniorActions: React.FC<FinanceiroJuniorActionsProps> = ({ 
  removal, 
  onClose,
  isEditing,
  setIsEditing,
  activeEditTab,
  setActiveEditTab,
}) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const { schedule } = useAgenda();
  const { priceTable } = usePricing();
  
  // States
  const [items, setItems] = useState<CustomAdditional[]>([]);
  const [productName, setProductName] = useState('');
  const [productValue, setProductValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'receber' | 'devolver'>('receber');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentProof, setAdjustmentProof] = useState<File | null>(null);
  const [newModality, setNewModality] = useState<Removal['modality']>(removal.modality);
  const [modalityDifference, setModalityDifference] = useState(0);
  const [modalityProof, setModalityProof] = useState<File | null>(null);
  const [cremationCompany, setCremationCompany] = useState<Removal['cremationCompany'] | undefined>(undefined);
  const [cremationDate, setCremationDate] = useState('');
  const [certificateObs, setCertificateObs] = useState('');
  const [isConfirmingFinalization, setIsConfirmingFinalization] = useState(false);
  const [isConfirmingDeliveryFinalization, setIsConfirmingDeliveryFinalization] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCremationDataModalOpen, setIsCremationDataModalOpen] = useState(false);

  const isCollective = removal.modality === 'coletivo';

  useEffect(() => {
    if (isEditing) {
      setItems(removal.customAdditionals || []);
      setNewModality(removal.modality);
      setCremationCompany(removal.cremationCompany);
      setCremationDate(removal.cremationDate || '');
      setCertificateObs(removal.certificateObservations || '');
    }
  }, [isEditing, removal]);

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

  useEffect(() => {
    if (activeEditTab === 'change_modality' && newModality && newModality !== removal.modality) {
      const weightKey = removal.realWeight 
        ? getWeightKeyFromRealWeight(removal.realWeight) 
        : removal.pet.weight as keyof typeof priceTable;
      
      if (weightKey) {
        const oldPrice = priceTable[weightKey]?.[removal.modality] || 0;
        const newPrice = priceTable[weightKey]?.[newModality] || 0;
        setModalityDifference(newPrice - oldPrice);
      }
    } else {
      setModalityDifference(0);
    }
  }, [newModality, activeEditTab, removal, priceTable]);

  const handleEditClick = () => {
    const postCremationStatuses: RemovalStatus[] = ['cremado', 'pronto_para_entrega', 'finalizada'];
    const isCremationProcessStarted = 
        postCremationStatuses.includes(removal.status) ||
        (removal.cremationCompany === 'SQP' && removal.status === 'aguardando_baixa_master');

    if (isCremationProcessStarted) {
        alert('Não é possível adicionar ou editar produtos. O pet já foi cremado ou encaminhado para cremação.');
        return;
    }

    setActiveEditTab('add');
    setIsEditing(true);
  };

  const resetAndCloseEdit = () => {
    setIsEditing(false);
    setProductName(''); setProductValue(''); setSelectedFile(null);
    setAdjustmentValue(''); setAdjustmentProof(null);
    setNewModality(removal.modality); setModalityDifference(0); setModalityProof(null);
    setCremationCompany(undefined); setCremationDate(''); setCertificateObs('');
  };

  const handleConfirmFinalization = () => {
    if (!user) return;
    if (!removal.cremationCompany) {
      alert('Por favor, defina a empresa de cremação (PETCÈU ou SQP) na aba "Dados Cremação" antes de finalizar.');
      setIsConfirmingFinalization(false);
      return;
    }
    const isScheduled = Object.values(schedule).some(scheduledRemoval => scheduledRemoval.code === removal.code);
    const farewellText = isScheduled ? `com despedida agendada` : `sem despedida agendada`;
    updateRemoval(removal.id, {
      status: 'aguardando_baixa_master',
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} finalizou e enviou para o Financeiro Master (${removal.cremationCompany}) ${farewellText}`, user: user.name }],
    });
    onClose();
  };

  const handleFinalizeDeliveryForMaster = () => {
    if (!user) return;
    updateRemoval(removal.id, {
        status: 'aguardando_baixa_master',
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Pronto para entrega. Finalizado para Master por ${user.name.split(' ')[0]}.`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  const handleReturnToOperational = () => {
    if (!user) return;
    updateRemoval(removal.id, {
      status: 'aguardando_baixa_master',
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} retornou a remoção para o Operacional.`, user: user.name }],
    });
    onClose();
  };

  const handleSendToRelease = () => {
    if (!user) return;
    updateRemoval(removal.id, {
      status: 'aguardando_baixa_master',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Enviado para liberação de cremação sem despedida pelo Fin. Junior ${user.name.split(' ')[0]}`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleAddItem = () => {
    if (productName && productValue && items.length < 10) {
      const processAndAddItem = (proofString?: string) => {
        setItems([...items, { id: new Date().toISOString(), name: productName, value: parseFloat(productValue), paymentProof: proofString }]);
        setProductName(''); setProductValue(''); setSelectedFile(null);
        const fileInput = document.getElementById('custom-product-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      };
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => processAndAddItem(`${e.target?.result as string}||${selectedFile.name}`);
        reader.readAsDataURL(selectedFile);
      } else {
        processAndAddItem();
      }
    }
  };

  const handleCollectiveAddItem = (product: { name: string; value: number }) => {
    setItems(prev => [...prev, { id: new Date().toISOString() + Math.random(), name: product.name, value: product.value }]);
  };

  const handleCollectiveRemoveItem = (productName: string) => {
    setItems(prev => {
      const itemIndex = prev.findLastIndex(item => item.name === productName);
      if (itemIndex > -1) {
        const newItems = [...prev];
        newItems.splice(itemIndex, 1);
        return newItems;
      }
      return prev;
    });
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(item => item.id !== id));

  const handleSaveItems = async () => {
    if (!user) return;
    let proofString: string | undefined = undefined;
    if (isCollective && selectedFile) {
        proofString = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(`${e.target?.result as string}||${selectedFile.name}`);
            reader.readAsDataURL(selectedFile);
        });
    }
    const originalItems = removal.customAdditionals || [];
    const processedItems = isCollective ? items.map(item => !originalItems.some(oi => oi.id === item.id) && proofString ? { ...item, paymentProof: proofString } : item) : items;
    const addedItems = processedItems.filter(i => !originalItems.some(oi => oi.id === oi.id));
    const removedItems = originalItems.filter(oi => !processedItems.some(i => i.id === oi.id));
    let historyActions: string[] = [];
    if (addedItems.length > 0) {
        const summary = new Map<string, { count: number, hasProof: boolean, value: number }>();
        addedItems.forEach(item => {
            const existing = summary.get(item.name) || { count: 0, hasProof: false, value: 0 };
            existing.count++; existing.hasProof = existing.hasProof || !!item.paymentProof; existing.value = item.value;
            summary.set(item.name, existing);
        });
        const itemsSummary = Array.from(summary.entries()).map(([name, data]) => `${data.count}x ${name} (R$ ${(data.value * data.count).toFixed(2)})${data.hasProof ? ` [comprovante anexado]` : ''}`).join(', ');
        historyActions.push(`adicionou: ${itemsSummary}`);
    }
    if (removedItems.length > 0) {
        const summary = new Map<string, { count: number, value: number }>();
        removedItems.forEach(item => {
            const existing = summary.get(item.name) || { count: 0, value: 0 };
            existing.count++; existing.value = item.value;
            summary.set(item.name, existing);
        });
        const itemsSummary = Array.from(summary.entries()).map(([name, data]) => `${data.count}x ${name}`).join(', ');
        historyActions.push(`removeu: ${itemsSummary}`);
    }
    if (historyActions.length > 0) {
        const diff = processedItems.reduce((acc, item) => acc + item.value, 0) - originalItems.reduce((acc, item) => acc + item.value, 0);
        updateRemoval(removal.id, {
            customAdditionals: processedItems, value: removal.value + diff,
            history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${historyActions.join(' e ')}.`, user: user.name }],
        });
    }
    resetAndCloseEdit();
  };
  
  const handleSaveAdjustment = () => {
    if (!user || !adjustmentValue) return;
    const value = parseFloat(adjustmentValue);
    const actionText = adjustmentType === 'receber' ? `recebeu um valor de R$ ${value.toFixed(2)}` : `devolveu um valor de R$ ${value.toFixed(2)}`;
    updateRemoval(removal.id, {
      value: adjustmentType === 'receber' ? removal.value + value : removal.value - value,
      adjustmentConfirmed: true,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: adjustmentProof ? adjustmentProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveModality = () => {
    if (!user || modalityDifference === 0) return;
    const actionText = `alterou a modalidade de ${removal.modality.replace(/_/g, ' ')} para ${newModality.replace(/_/g, ' ')}, com um ajuste de R$ ${modalityDifference.toFixed(2)}`;
    updateRemoval(removal.id, {
      modality: newModality, value: removal.value + modalityDifference,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: modalityProof ? modalityProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveCremationData = () => {
    if (!user) return;
    const companyChanged = cremationCompany !== (removal.cremationCompany || undefined);
    const dateChanged = cremationDate !== (removal.cremationDate || '');
    const obsChanged = certificateObs !== (removal.certificateObservations || '');
    if (!companyChanged && !dateChanged && !obsChanged) { resetAndCloseEdit(); return; }
    const actionParts: string[] = [];
    if (companyChanged && cremationCompany) actionParts.push(`definiu a empresa de cremação para ${cremationCompany}`);
    if (dateChanged && cremationDate) {
        const [year, month, day] = cremationDate.split('-');
        actionParts.push(`definiu a data de cremação para ${day}/${month}/${year}`);
    }
    if (obsChanged) actionParts.push(certificateObs ? `adicionou a observação ao certificado: "${certificateObs}"` : `removeu as observações do certificado`);
    if (actionParts.join(' e ')) {
        updateRemoval(removal.id, {
            cremationCompany, cremationDate, certificateObservations: certificateObs,
            history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionParts.join(' e ')}.`, user: user.name }],
        });
    }
    resetAndCloseEdit();
  };

  const handleNotifyTutor = () => {
    if (!user || !removal.tutor.phone) {
        alert('Número de contato do tutor não encontrado.');
        return;
    }

    const tutorName = removal.tutor.name;
    let message = '';

    if (removal.modality === 'coletivo') {
        const productNames = removal.customAdditionals?.map(ad => ad.name).join(', ') || 'sua lembrancinha';
        message = `Olá ${tutorName}, a lembrancinha do seu anjinho (${productNames}) já está pronta para retirada ou entrega. Nosso horário de atendimento para retirada é de segunda a sexta, das 9h às 17h, e sábado, das 8:30h às 11:30h. A unidade de retirada fica na Rua Santa Helena, 51, Centro, Pinhais - CEP 83.324-220. Se quiser optar por entrega via motoboy, o custo é de R$ 30,00. Favor nos acionar respondendo qual opção é melhor. Lembrando que para a entrega temos agendamento, verificar disponibilidade.`;
    } else { // Individual
        message = `Olá ${tutorName}, seu anjinho já está pronto para retirada ou entrega. Nosso horário de atendimento para retirada é de segunda a sexta, das 9h às 17h, e sábado, das 8:30h às 11:30h. A unidade de retirada fica na Rua Santa Helena, 51, Centro, Pinhais - CEP 83.324-220. Se quiser optar por entrega via motoboy, o custo é de R$ 30,00. Favor nos acionar respondendo qual opção é melhor. Lembrando que para a entrega temos agendamento, verificar disponibilidade.`;
    }

    const cleanedPhone = removal.tutor.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanedPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    updateRemoval(removal.id, {
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Financeiro Junior ${user.name.split(' ')[0]} notificou o tutor sobre a retirada/entrega via WhatsApp.`,
                user: user.name,
            },
        ],
    });
  };

  const handleGenerateCertificate = () => {
    if (!removal.cremationDate || !removal.cremationCompany) {
      setIsCremationDataModalOpen(true);
    } else {
      setIsCertificateModalOpen(true);
    }
  };

  const handleConfirmCremationData = (data: { date: string; company: 'PETCÈU' | 'SQP' }) => {
    if (!user) return;
    const [year, month, day] = data.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const updates: Partial<Removal> = {};
    const historyActions: string[] = [];

    if (!removal.cremationDate && data.date) {
        updates.cremationDate = data.date;
        historyActions.push(`data de cremação definida para ${formattedDate}`);
    }
    if (!removal.cremationCompany && data.company) {
        updates.cremationCompany = data.company;
        historyActions.push(`empresa de cremação definida para ${data.company}`);
    }

    if (historyActions.length > 0) {
        updateRemoval(removal.id, {
          ...updates,
          history: [
            ...removal.history,
            {
              date: new Date().toISOString(),
              action: `Financeiro Junior ${user.name.split(' ')[0]} atualizou dados para certificado: ${historyActions.join(' e ')}.`,
              user: user.name,
            },
          ],
        });
    }
    
    setIsCremationDataModalOpen(false);
    setTimeout(() => {
        setIsCertificateModalOpen(true);
    }, 100);
  };

  // Handle 'Pronto para Entrega' tab
  if (removal.status === 'pronto_para_entrega') {
    const tutorNotified = removal.history.some(h => h.action.includes('notificou o tutor'));

    if (isConfirmingDeliveryFinalization) {
        return (
            <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-yellow-900 mb-3 text-center">Tem certeza que deseja finalizar e enviar para o Master?</h4>
                <div className="flex gap-2">
                    <button onClick={() => setIsConfirmingDeliveryFinalization(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                    <button onClick={handleFinalizeDeliveryForMaster} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
                >
                    <Edit size={16} /> Adicionar/Editar Produtos
                </button>
                <button
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                    <Award size={16} /> Gerar Certificado
                </button>
                <button
                    onClick={handleNotifyTutor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <MessageSquare size={16} /> Avisar Tutor
                </button>
                {tutorNotified && (
                    <button
                        onClick={() => setIsConfirmingDeliveryFinalization(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Send size={16} /> Finalizar para Master
                    </button>
                )}
            </div>
            <CremationDataModal
                isOpen={isCremationDataModalOpen}
                onClose={() => setIsCremationDataModalOpen(false)}
                onConfirm={handleConfirmCremationData}
                removal={removal}
            />
            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                removal={removal}
            />
        </>
    );
  }

  // Handle 'Finalizadas' tab (status: aguardando_baixa_master)
  if (removal.status === 'aguardando_baixa_master') {
    return (
        <>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
                >
                    <Edit size={16} /> Adicionar/Editar Produtos
                </button>
                <button
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                    <Award size={16} /> Gerar Certificado
                </button>
            </div>
            <CremationDataModal
                isOpen={isCremationDataModalOpen}
                onClose={() => setIsCremationDataModalOpen(false)}
                onConfirm={handleConfirmCremationData}
                removal={removal}
            />
            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                removal={removal}
            />
        </>
    );
  }

  // Handle 'Pendentes' tabs (status: aguardando_financeiro_junior)
  if (removal.status === 'aguardando_financeiro_junior') {
    if (isEditing) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-shrink-0 border-b">
            <button onClick={() => setActiveEditTab('add')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Adicionar Produtos</button>
            <button onClick={() => setActiveEditTab('adjust')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'adjust' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Abater Valores</button>
            <button onClick={() => setActiveEditTab('change_modality')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'change_modality' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Alterar Modalidade</button>
            <button onClick={() => setActiveEditTab('cremation')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'cremation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Dados Cremação</button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            {activeEditTab === 'add' && (isCollective ? (
              <div className="space-y-4">
                <div className="space-y-3 p-3 bg-gray-50 rounded-md border">
                  {collectiveAdditionals.map(product => (<div key={product.id} className="flex justify-between items-center py-2 border-b last:border-b-0"><div><p className="font-medium">{product.name}</p><p className="text-sm text-green-600">R$ {product.value.toFixed(2)}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => handleCollectiveRemoveItem(product.name)} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50" disabled={items.filter(i => i.name === product.name).length === 0}><Minus size={16} /></button><span className="font-bold text-lg w-8 text-center">{items.filter(i => i.name === product.name).length}</span><button type="button" onClick={() => handleCollectiveAddItem(product)} className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><Plus size={16} /></button></div></div>))}
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input id="collective-product-file-input" type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 p-3 bg-gray-50 rounded-md border"><div className="flex gap-2 items-end"><div className="flex-grow"><label className="text-xs font-medium text-gray-600">Produto</label><input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nome do produto" className="w-full px-2 py-1 border rounded-md text-sm" /></div><div className="w-24"><label className="text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="Valor" className="w-full px-2 py-1 border rounded-md text-sm" /></div></div><div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input id="custom-product-file-input" type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div><button onClick={handleAddItem} disabled={items.length >= 10 || !productName || !productValue} className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm flex items-center justify-center gap-1 disabled:opacity-50"><Plus size={16} /> Adicionar Item</button></div>
                {items.length > 0 && <div className="space-y-2"><p className="text-sm font-medium">Itens Adicionados:</p><ul className="list-disc list-inside text-sm bg-gray-100 p-3 rounded-md border">{items.map(item => (<li key={item.id} className="flex justify-between items-center py-1"><span>{item.name} - R$ {item.value.toFixed(2)}</span><button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button></li>))}</ul></div>}
              </div>
            ))}
            {activeEditTab === 'adjust' && <div className="space-y-4 p-1"><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="receber" checked={adjustmentType === 'receber'} onChange={() => setAdjustmentType('receber')} />Receber</label><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="devolver" checked={adjustmentType === 'devolver'} onChange={() => setAdjustmentType('devolver')} />Devolver</label></div><div><label className="text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} placeholder="Valor do ajuste" className="w-full px-2 py-1 border rounded-md text-sm" /></div><div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setAdjustmentProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div></div>}
            {activeEditTab === 'change_modality' && <div className="space-y-4 p-1"><div><label className="text-xs font-medium text-gray-600">Nova Modalidade</label><select value={newModality} onChange={e => setNewModality(e.target.value as Removal['modality'])} className="w-full px-2 py-1 border rounded-md text-sm"><option value="coletivo">Coletivo</option><option value="individual_prata">Individual Prata</option><option value="individual_ouro">Individual Ouro</option></select></div>{modalityDifference !== 0 && <div className={`p-3 rounded-md text-sm ${modalityDifference > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{modalityDifference > 0 ? `Valor a cobrar: R$ ${modalityDifference.toFixed(2)}` : `Valor a devolver: R$ ${Math.abs(modalityDifference).toFixed(2)}`}</div>}<div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setModalityProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div></div>}
            {activeEditTab === 'cremation' && <div className="space-y-4 p-1"><div><label className="text-xs font-medium text-gray-600 flex items-center mb-2"><Building className="h-4 w-4 mr-2"/>Empresa de Cremação</label><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="cremationCompany" value="PETCÈU" checked={cremationCompany === 'PETCÈU'} onChange={() => setCremationCompany('PETCÈU')} />PETCÈU</label><label className="flex items-center gap-2"><input type="radio" name="cremationCompany" value="SQP" checked={cremationCompany === 'SQP'} onChange={() => setCremationCompany('SQP')} />SQP</label></div></div><div><label className="text-xs font-medium text-gray-600">Data da Cremação</label><input type="date" value={cremationDate} onChange={e => setCremationDate(e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" /></div><div><label className="text-xs font-medium text-gray-600">Observações para o Certificado</label><textarea value={certificateObs} onChange={e => setCertificateObs(e.target.value)} placeholder="Ex: Adicionar nome do tutor no certificado" rows={3} className="w-full px-2 py-1 border rounded-md text-sm" /></div></div>}
          </div>
          <div className="flex-shrink-0 p-3 border-t bg-gray-50 flex justify-end gap-2">
            <button onClick={resetAndCloseEdit} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm">Cancelar</button>
            {activeEditTab === 'add' && <button onClick={handleSaveItems} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1"><Save size={14} /> Salvar Produtos</button>}
            {activeEditTab === 'adjust' && <button onClick={handleSaveAdjustment} disabled={!adjustmentValue} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 disabled:opacity-50"><Save size={14} /> Salvar Abatimento</button>}
            {activeEditTab === 'change_modality' && <button onClick={handleSaveModality} disabled={modalityDifference === 0} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 disabled:opacity-50"><Save size={14} /> Salvar Alteração</button>}
            {activeEditTab === 'cremation' && <button onClick={handleSaveCremationData} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1"><Flame size={14} /> Salvar Dados</button>}
          </div>
        </div>
      );
    }
    if (isConfirmingFinalization) {
      return (
          <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-3 text-center">Tem certeza que deseja finalizar para Master?</h4>
              <div className="flex gap-2">
                  <button onClick={() => setIsConfirmingFinalization(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                  <button onClick={handleConfirmFinalization} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
              </div>
          </div>
      );
    }

    const isScheduled = Object.values(schedule).some(scheduledRemoval => scheduledRemoval.code === removal.code);

    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button onClick={handleEditClick} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"><Edit size={16} /> Adicionar/Editar</button>
        
        {!isCollective && !isScheduled && (
          <button
            onClick={handleSendToRelease}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-2"
          >
            <Send size={16} /> Enviar p/ Liberação
          </button>
        )}

        {isCollective && <button onClick={handleReturnToOperational} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-2"><Undo size={16} /> Retornar / Operacional</button>}
        
        <button onClick={() => setIsConfirmingFinalization(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><CheckCircle size={16} /> Finalizar para Master</button>
      </div>
    );
  }

  return null;
};

export default FinanceiroJuniorActions;
