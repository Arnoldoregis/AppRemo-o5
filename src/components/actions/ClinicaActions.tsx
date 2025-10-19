import React from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { XCircle } from 'lucide-react';

interface ClinicaActionsProps {
  removal: Removal;
  onClose: () => void;
}

const ClinicaActions: React.FC<ClinicaActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();

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
            action: `Remoção Cancelada pela clínica`,
            user: user.name,
            reason: reason,
          },
        ],
      });
      onClose();
    }
  };

  // O botão de cancelar fica visível até o motorista efetuar a remoção (status 'removido').
  const canCancel = ['solicitada', 'agendada', 'em_andamento', 'a_caminho'].includes(removal.status);

  if (!canCancel) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCancel}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
      >
        <XCircle size={16} /> Cancelar Remoção
      </button>
    </div>
  );
};

export default ClinicaActions;
