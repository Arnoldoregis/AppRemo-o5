import React, { useState, useEffect } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Undo, XCircle, AlertTriangle, Loader, FastForward } from 'lucide-react';
import { mockDrivers } from '../../data/mock';
import { geocodeAddress, calculateDistance } from '../../utils/geoUtils';

interface ReceptorActionsProps {
  removal: Removal;
  onClose: () => void;
}

const ReceptorActions: React.FC<ReceptorActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval, removals } = useRemovals();
  const { user } = useAuth();
  const [isDirecting, setIsDirecting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [priorityTime, setPriorityTime] = useState('');
  const [suggestedDriverId, setSuggestedDriverId] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

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
      alert('Por favor, selecione um motorista.');
      return;
    }
    setIsConfirming(true);
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
              <option value="">Selecione um motorista</option>
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
