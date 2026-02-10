import React, { useState, useEffect } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Undo, XCircle, AlertTriangle, Loader, FastForward, MessageSquare, Award, Building } from 'lucide-react';
import { mockDrivers } from '../../data/mock';
import { geocodeAddress, calculateDistance } from '../../utils/geoUtils';
import CertificateModal from '../modals/CertificateModal';
import CremationDataModal from '../modals/CremationDataModal';

interface ReceptorActionsProps {
  removal: Removal;
  onClose: () => void;
}

const ReceptorActions: React.FC<ReceptorActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval, removals } = useRemovals();
  const { user } = useAuth();
  const [isDirecting, setIsDirecting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  
  // Estados de confirmação
  const [isConfirming, setIsConfirming] = useState(false); // Confirmação de motorista
  const [isConfirmingPetCeu, setIsConfirmingPetCeu] = useState(false); // Confirmação de Pet Céu
  
  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [priorityTime, setPriorityTime] = useState('');
  const [suggestedDriverId, setSuggestedDriverId] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // Estados para Pronto para Entrega (Gerar Certificado / Finalizar)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCremationDataModalOpen, setIsCremationDataModalOpen] = useState(false);
  const [isConfirmingDeliveryFinalization, setIsConfirmingDeliveryFinalization] = useState(false);

  useEffect(() => {
    if (isDirecting) {
        const findBestDriver = async () => {
            setIsLoadingSuggestion(true);
            setSuggestedDriverId(null);

            const newRemovalCoords = await geocodeAddress(removal.removalAddress);
            if (!newRemovalCoords) {
                setIsLoadingSuggestion(false);
                return;
            }

            const activeRemovals = removals.filter(r =>
                (r.status === 'em_andamento' || r.status === 'a_caminho') &&
                r.assignedDriver &&
                r.id !== removal.id
            );

            if (activeRemovals.length === 0) {
                setIsLoadingSuggestion(false);
                return;
            }

            let closestDistance = Infinity;
            let bestDriverId: string | null = null;

            for (const activeRemoval of activeRemovals) {
                const activeRemovalCoords = await geocodeAddress(activeRemoval.removalAddress);
                if (activeRemovalCoords) {
                    const distance = calculateDistance(newRemovalCoords, activeRemovalCoords);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        bestDriverId = activeRemoval.assignedDriver!.id;
                    }
                }
                // Delay to respect Nominatim's usage policy (max 1 request/sec)
                await new Promise(resolve => setTimeout(resolve, 1100));
            }

            setSuggestedDriverId(bestDriverId);
            setIsLoadingSuggestion(false);
        };

        findBestDriver();
    }
  }, [isDirecting, removal.id, removal.removalAddress, removals]);

  const handleAnticipate = () => {
    if (!user) return;
    updateRemoval(removal.id, {
      status: 'solicitada',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Agendamento antecipado. A remoção foi movida para a fila de recebidas.`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const executeDirect = () => {
    if (!selectedDriverId || !user) return;

    const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver) return;

    let actionText = `Receptor ${user.name.split(' ')[0]} encaminhou para o motorista ${selectedDriver.name}`;
    const updates: Partial<Removal> = {
      status: 'em_andamento',
      assignedDriver: selectedDriver,
    };

    if (isPriority) {
      updates.isPriority = true;
      if (priorityTime) {
        updates.priorityDeadline = priorityTime;
        actionText += ` com prioridade (chegar até ${priorityTime}).`;
      } else {
        actionText += ` com prioridade.`;
      }
    }

    updates.history = [
      ...removal.history,
      {
        date: new Date().toISOString(),
        action: actionText,
        user: user.name,
      },
    ];

    updateRemoval(removal.id, updates);

    if (selectedDriver.phone) {
        let messageText = 'Uma nova remoção foi atribuida a você. Dirija-se ao local.';
        if (isPriority) {
            messageText = `ATENÇÃO: REMOÇÃO PRIORITÁRIA! ${messageText}`;
            if (priorityTime) {
                messageText += ` O horário limite para chegada é ${priorityTime}.`;
            }
        }
        const message = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/55${selectedDriver.phone}?text=${message}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    onClose();
  };

  const handleConfirmClick = () => {
    if (!selectedDriverId) {
      alert('Por favor, selecione uma opção.');
      return;
    }

    if (selectedDriverId === 'pet_ceu') {
        setIsConfirmingPetCeu(true);
    } else {
        setIsConfirming(true);
    }
  };

  const handlePetCeuConfirm = () => {
    if (!user) return;

    // Atualiza para 'concluida' para ir direto para o Operacional (Pendente Individual/Coletivo)
    updateRemoval(removal.id, {
        status: 'concluida',
        assignedDriver: undefined, // Sem motorista pois foi trazido pelo tutor
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Tutor trouxe o pet até a Pet Céu. Recebido pelo Receptor ${user.name.split(' ')[0]}. Encaminhado para o Operacional.`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  const handleRevert = () => {
    if (!user) return;
    updateRemoval(removal.id, {
      status: 'solicitada',
      assignedDriver: undefined,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: 'Direcionamento revertido para análise',
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleCancel = () => {
    if (!user) return;
    const reason = prompt('Por favor, insira o motivo do cancelamento:');
    if (reason) {
      updateRemoval(removal.id, {
        status: 'cancelada',
        cancellationReason: reason,
        history: [
          ...removal.history,
          {
            date: new Date().toISOString(),
            action: 'Remoção Cancelada',
            user: user.name,
            reason: reason,
          },
        ],
      });
      onClose();
    }
  };

  // Funções para Pronto para Entrega
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
                action: `Receptor ${user.name.split(' ')[0]} notificou o tutor sobre a retirada/entrega via WhatsApp.`,
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
              action: `Receptor ${user.name.split(' ')[0]} atualizou dados para certificado: ${historyActions.join(' e ')}.`,
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

  const handleFinalizeDeliveryForMaster = () => {
    if (!user) return;
    updateRemoval(removal.id, {
        status: 'aguardando_baixa_master',
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Pronto para entrega. Finalizado para Master por Receptor ${user.name.split(' ')[0]}.`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  // Renderização para Pronto para Entrega
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

  // Renderização para Confirmação "Trouxe a Pet Céu"
  if (isConfirmingPetCeu) {
    return (
        <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-300 space-y-4">
            <div>
                <h4 className="font-semibold text-blue-900 mb-3 text-center flex items-center justify-center gap-2">
                    <Building className="h-5 w-5" />
                    Tutor Trouxe o pet até a Pet Céu?
                </h4>
                <p className="text-sm text-blue-800 text-center mb-4">
                    Ao confirmar, a remoção será enviada diretamente para o Operacional (Pendente).
                </p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsConfirmingPetCeu(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                <button onClick={handlePetCeuConfirm} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">SIM</button>
            </div>
        </div>
    );
  }

  if (isConfirming) {
    const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300 space-y-4">
        <div>
          <h4 className="font-semibold text-yellow-900 mb-3 text-center">
            Tem certeza que quer atribuir remoção ao motorista {selectedDriver?.name}?
          </h4>
        </div>
        
        <div className="space-y-2 p-3 bg-white rounded-md border">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox"
                    checked={isPriority}
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-red-700 flex items-center gap-1"><AlertTriangle size={16} /> Prioridade</span>
            </label>
            {isPriority && (
                <div className="pl-6">
                    <label htmlFor="priorityTime" className="block text-xs font-medium text-gray-600 mb-1">
                        Horário limite para chegada
                    </label>
                    <input
                        id="priorityTime"
                        type="time"
                        value={priorityTime}
                        onChange={(e) => setPriorityTime(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                </div>
            )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setIsConfirming(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
          <button onClick={executeDirect} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
        </div>
      </div>
    );
  }

  if (isConfirmingRevert) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza que deseja retornar a remoção e direcioná-la para outro motorista?
        </h4>
        <div className="flex gap-2">
          <button onClick={() => setIsConfirmingRevert(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
          <button onClick={handleRevert} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
        </div>
      </div>
    );
  }

  if (isDirecting) {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-full">
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma opção</option>
              <option value="pet_ceu" className="font-bold text-blue-700">Trouxe a Pet Céu</option>
              <option disabled>──────────</option>
              {mockDrivers.map(driver => (
                <option 
                    key={driver.id} 
                    value={driver.id}
                    className={driver.id === suggestedDriverId ? 'bg-green-100 font-bold text-green-800' : ''}
                >
                    {driver.name} {driver.id === suggestedDriverId ? '(Sugerido - Mais próximo)' : ''}
                </option>
              ))}
            </select>
            <button onClick={handleConfirmClick} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirmar</button>
            <button onClick={() => setIsDirecting(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Voltar</button>
        </div>
        {isLoadingSuggestion && (
            <div className="flex items-center text-sm text-blue-600 mt-2">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Analisando rotas dos motoristas...
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {removal.status === 'agendada' && (
        <button
          onClick={handleAnticipate}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2"
        >
          <FastForward size={16} /> Antecipar / Mover para Recebidas
        </button>
      )}
      {removal.status === 'solicitada' && (
        <button
          onClick={() => setIsDirecting(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={16} /> Direcionar
        </button>
      )}
      {removal.status === 'em_andamento' && (
        <button
          onClick={() => setIsConfirmingRevert(true)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
        >
          <Undo size={16} /> Retornar p/ Análise
        </button>
      )}
      {(removal.status === 'solicitada' || removal.status === 'em_andamento') && (
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <XCircle size={16} /> Cancelar Remoção
        </button>
      )}
    </div>
  );
};

export default ReceptorActions;
