import React, { useState } from 'react';
import { Removal } from '../types';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import { Send, Undo, XCircle } from 'lucide-react';
import { mockDrivers } from '../data/mock';

interface ReceptorActionsProps {
  removal: Removal;
  onClose: () => void;
}

const ReceptorActions: React.FC<ReceptorActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isDirecting, setIsDirecting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const handleDirect = () => {
    if (!selectedDriverId || !user) return;

    const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver) return;

    updateRemoval(removal.code, {
      status: 'em_andamento',
      assignedDriver: selectedDriver,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Receptor ${user.name.split(' ')[0]} encaminhou para o motorista ${selectedDriver.name}`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleRevert = () => {
    if (!user) return;
    updateRemoval(removal.code, {
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
      updateRemoval(removal.code, {
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

  if (isDirecting) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um motorista</option>
          {mockDrivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
        <button onClick={handleDirect} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirmar</button>
        <button onClick={() => setIsDirecting(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Voltar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
          onClick={handleRevert}
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
