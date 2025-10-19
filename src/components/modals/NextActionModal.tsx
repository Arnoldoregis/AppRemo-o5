import React, { useState } from 'react';
import { Removal, NextTask } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRemovals } from '../../context/RemovalContext';
import { geocodeAddress, calculateDistance } from '../../utils/geoUtils';
import { Loader, Map, Coffee, Truck, Hand } from 'lucide-react';

interface NextActionModalProps {
  currentRemoval: Removal;
  removals: Removal[];
  onClose: (nextTask?: NextTask) => void;
}

const NextActionModal: React.FC<NextActionModalProps> = ({ currentRemoval, removals, onClose }) => {
  const { user } = useAuth();
  const { setDriverReturningToHQ } = useRemovals();
  const [isLoading, setIsLoading] = useState(false);

  const handleNextTask = async () => {
    if (!user) return;
    setIsLoading(true);

    const currentLocationCoords = await geocodeAddress(currentRemoval.removalAddress);
    if (!currentLocationCoords) {
      alert('Não foi possível obter a localização atual. Verifique o endereço da remoção concluída.');
      setIsLoading(false);
      return;
    }

    const driverRemovals = removals.filter(r => r.assignedDriver?.id === user.id);
    const driverDeliveries = removals.filter(d => d.deliveryPerson === user.name);

    const pendingRemovals = driverRemovals.filter(r => r.status === 'em_andamento');
    const pendingDeliveries = driverDeliveries.filter(d => d.status === 'entrega_agendada');

    const allPendingTasks: NextTask[] = [
      ...pendingRemovals.map(r => ({ ...r, taskType: 'removal' as const })),
      ...pendingDeliveries.map(d => ({ ...d, taskType: 'delivery' as const })),
    ];

    if (allPendingTasks.length === 0) {
      alert('Nenhuma outra tarefa pendente no momento.');
      setIsLoading(false);
      onClose();
      return;
    }

    let closestTask: (NextTask & { distance: number }) | null = null;

    for (const task of allPendingTasks) {
      const address = task.taskType === 'delivery' ? (task.deliveryAddress || task.removalAddress) : task.removalAddress;
      const taskCoords = await geocodeAddress(address);
      await new Promise(resolve => setTimeout(resolve, 1100)); // Respect API limit

      if (taskCoords) {
        const distance = calculateDistance(currentLocationCoords, taskCoords);
        if (!closestTask || distance < closestTask.distance) {
          closestTask = { ...task, distance };
        }
      }
    }

    setIsLoading(false);

    if (!closestTask) {
      alert('Não foi possível calcular a rota para as tarefas pendentes.');
      onClose();
      return;
    }

    if (closestTask.taskType === 'delivery') {
      const proceed = window.confirm('A tarefa mais próxima é uma entrega. Deseja realizá-la agora?');
      if (proceed) {
        onClose(closestTask);
      } else {
        // Find closest removal instead
        const removalsOnly = allPendingTasks.filter(t => t.taskType === 'removal');
        if (removalsOnly.length > 0) {
            let closestRemovalTask: (NextTask & { distance: number }) | null = null;
             for (const task of removalsOnly) {
                const address = task.removalAddress;
                const taskCoords = await geocodeAddress(address);
                await new Promise(resolve => setTimeout(resolve, 1100));
                if (taskCoords) {
                    const distance = calculateDistance(currentLocationCoords, taskCoords);
                    if (!closestRemovalTask || distance < closestRemovalTask.distance) {
                        closestRemovalTask = { ...task, distance };
                    }
                }
             }
             if(closestRemovalTask) {
                onClose(closestRemovalTask);
             } else {
                alert("Não foi possível calcular a rota para as remoções pendentes.");
                onClose();
             }
        } else {
            alert("Nenhuma remoção pendente encontrada.");
            onClose();
        }
      }
    } else {
      onClose(closestTask);
    }
  };

  const handleReturnToHQ = () => {
    setDriverReturningToHQ(true);
    const destination = encodeURIComponent('Rua Santa Helena 51, Pinhais, PR');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleBreak = () => {
    onClose();
  };
  
  const handleManualChoice = () => {
    onClose();
  };

  return (
    <div className="w-full p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">Remoção finalizada!</h3>
      <p className="text-sm text-center text-gray-600 mb-6">O que você deseja fazer agora?</p>
      
      <div className="space-y-3">
        <button
          onClick={handleNextTask}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader className="animate-spin h-5 w-5" /> : <Truck className="h-5 w-5" />}
          Ir para a próxima tarefa
        </button>
        
        <button
          onClick={handleManualChoice}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Hand className="h-5 w-5" />
          Escolher próxima tarefa manualmente
        </button>

        <button
          onClick={handleReturnToHQ}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Map className="h-5 w-5" />
          Ir para a empresa descarregar
        </button>

        <button
          onClick={handleBreak}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <Coffee className="h-5 w-5" />
          Pausa Almoço
        </button>
      </div>
    </div>
  );
};

export default NextActionModal;
