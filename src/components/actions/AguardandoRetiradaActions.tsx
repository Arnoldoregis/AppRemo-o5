import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { UserCheck } from 'lucide-react';

interface AguardandoRetiradaActionsProps {
  removal: Removal;
  onClose: () => void;
}

const AguardandoRetiradaActions: React.FC<AguardandoRetiradaActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmPickup = () => {
    if (!user) return;

    updateRemoval(removal.id, {
      status: 'finalizada',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} confirmou a retirada das cinzas pelo tutor.`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  if (isConfirming) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza que o tutor retirou as cinzas do pet "{removal.pet.name}"?
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsConfirming(false)} 
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            NÃO
          </button>
          <button 
            onClick={handleConfirmPickup} 
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            SIM
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
