import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface AguardandoRetiradaActionsProps {
  removal: Removal;
  onClose: () => void;
}

const AguardandoRetiradaActions: React.FC<AguardandoRetiradaActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [pickedUpBy, setPickedUpBy] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);

  const handleConfirmPickup = () => {
    if (!user || !pickedUpBy.trim() || !pickupDate) {
        alert("Por favor, preencha o nome de quem retirou e a data.");
        return;
    }

    const isCollectiveWithProducts = removal.modality === 'coletivo' &&
        ((removal.customAdditionals && removal.customAdditionals.length > 0) ||
         (removal.additionals && removal.additionals.length > 0));

    const nextStatus = isCollectiveWithProducts ? 'aguardando_baixa_master' : 'finalizada';

    const formattedDate = format(new Date(pickupDate + 'T00:00:00'), 'dd/MM/yyyy');

    const historyAction = isCollectiveWithProducts
        ? `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} confirmou a retirada em ${formattedDate} por ${pickedUpBy} e encaminhou para baixa do Master.`
        : `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} confirmou a retirada das cinzas em ${formattedDate} por ${pickedUpBy}.`;

    updateRemoval(removal.id, {
      status: nextStatus,
      deliveryStatus: 'delivered',
      history: [
        ...removal.history,
        {
          date: new Date(pickupDate).toISOString(),
          action: historyAction,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  if (isConfirming) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300 space-y-4">
        <h4 className="font-semibold text-yellow-900 mb-2 text-center">
          Confirmar Retirada - Pet "{removal.pet.name}"
        </h4>
        
        <div>
            <label htmlFor="pickedUpBy" className="block text-sm font-medium text-gray-700 mb-2">
                Nome de quem retirou *
            </label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    id="pickedUpBy"
                    type="text"
                    value={pickedUpBy}
                    onChange={(e) => setPickedUpBy(e.target.value)}
                    placeholder="Nome completo de quem retirou"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoFocus
                />
            </div>
        </div>

        <div>
            <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data da Retirada *
            </label>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => setIsConfirming(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
            Cancelar
          </button>
          <button 
            onClick={handleConfirmPickup} 
            disabled={!pickedUpBy.trim() || !pickupDate} 
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
            Confirmar Retirada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsConfirming(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
      >
        <UserCheck size={16} /> Retirado
      </button>
    </div>
  );
};

export default AguardandoRetiradaActions;
