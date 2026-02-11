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

    // Fallback strategy: Sort by Priority -> Date
    const getFallbackTask = () => {
        return allPendingTasks.sort((a, b) => {
            // 1. Priority
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            
            // 2. Date (Oldest first)
            const dateA = a.scheduledDeliveryDate ? new Date(a.scheduledDeliveryDate) : new Date(a.createdAt);
            const dateB = b.scheduledDeliveryDate ? new Date(b.scheduledDeliveryDate) : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
        })[0];
    };

    let closestTask: (NextTask & { distance: number }) | null = null;
    let currentLocationCoords = null;

    try {
        currentLocationCoords = await geocodeAddress(currentRemoval.removalAddress);
    } catch (error) {
        console.error("Error geocoding current location:", error);
    }

    // Only try to calculate distances if we have the current location
    if (currentLocationCoords) {
        for (const task of allPendingTasks) {
          const address = task.taskType === 'delivery' ? (task.deliveryAddress || task.removalAddress) : task.removalAddress;
          
          try {
              const taskCoords = await geocodeAddress(address);
              // Small delay to respect API limits, but shorter since we have caching now
              await new Promise(resolve => setTimeout(resolve, 600)); 

              if (taskCoords) {
                const distance = calculateDistance(currentLocationCoords, taskCoords);
                if (!closestTask || distance < closestTask.distance) {
                  closestTask = { ...task, distance };
                }
              }
          } catch (e) {
              console.warn(`Could not geocode task ${task.code}`, e);
          }
        }
    }

    setIsLoading(false);

    // If calculation failed (no coords, api error, etc), use fallback
    const targetTask = closestTask || getFallbackTask();

    if (!targetTask) {
      alert('Não foi possível determinar a próxima tarefa.');
      onClose();
      return;
    }

    if (!closestTask) {
        // Optional: Inform user that optimization failed but we are opening the next one anyway
        console.log("Geocoding failed or incomplete, using fallback task ordering.");
    }

    if (targetTask.taskType === 'delivery') {
      const proceed = window.confirm(`A próxima tarefa ${closestTask ? 'mais próxima' : 'sugerida'} é uma ENTREGA. Deseja realizá-la agora?`);
      if (proceed) {
        onClose(targetTask);
      } else {
        // User skipped delivery, try to find a removal
        const removalsOnly = allPendingTasks.filter(t => t.taskType === 'removal');
        if (removalsOnly.length > 0) {
             // Simple fallback for removal
             const nextRemoval = removalsOnly.sort((a, b) => {
                if (a.isPriority && !b.isPriority) return -1;
                if (!a.isPriority && b.isPriority) return 1;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
             })[0];
             onClose(nextRemoval);
        } else {
            alert("Nenhuma remoção pendente encontrada. Voltando ao painel.");
            onClose();
        }
      }
    } else {
      onClose(targetTask);
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
