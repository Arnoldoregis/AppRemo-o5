import React, { useState } from 'react';
import { Removal, NextTask } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Truck, Check, Scale } from 'lucide-react';
import NextActionModal from '../modals/NextActionModal';

interface MotoristaActionsProps {
  removal: Removal;
  onClose: (nextTask?: NextTask) => void;
}

const MotoristaActions: React.FC<MotoristaActionsProps> = ({ removal, onClose }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [realWeight, setRealWeight] = useState('');
  const [isConfirmingWeight, setIsConfirmingWeight] = useState(false);
  const [step, setStep] = useState<'askObservation' | 'addObservation' | 'addWeight'>('askObservation');
  const [petObservation, setPetObservation] = useState('');
  
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [modalProps, setModalProps] = useState<{ currentRemoval: Removal; removals: Removal[] } | null>(null);

  const handleUpdateStatus = (newStatus: Removal['status'], actionText: string) => {
    if (!user) return;

    const updates: Partial<Removal> = {
      status: newStatus,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Motorista ${user.name.split(' ')[0]} ${actionText}`,
          user: user.name,
        },
      ],
    };

    if (newStatus === 'removido') {
      updates.isPriority = false;
      updates.priorityDeadline = undefined;
      
      const updatedCurrentRemoval = { ...removal, ...updates };
      // Manually create an updated list to pass to the modal, avoiding state propagation delays
      const updatedRemovals = removals.map(r => r.id === removal.id ? updatedCurrentRemoval : r);
      
      updateRemoval(removal.id, updates);
      
      setModalProps({ currentRemoval: updatedCurrentRemoval, removals: updatedRemovals });
      setShowNextActionModal(true);
    } else {
      updateRemoval(removal.id, updates);
      onClose();
    }
  };

  const handleFinalize = () => {
    if (!user || !realWeight) return;

    const updates: Partial<Removal> = {
      status: 'concluida',
      realWeight: parseFloat(realWeight),
    };

    let actionText = `Motorista ${user.name.split(' ')[0]} pesou o pet (${realWeight} kg)`;

    if (petObservation.trim()) {
      updates.petCondition = removal.petCondition
        ? `${removal.petCondition}\n\nObservação do Motorista: ${petObservation.trim()}`
        : `Observação do Motorista: ${petObservation.trim()}`;
      actionText += ` com a observação: "${petObservation.trim()}"`;
    }

    actionText += ` e encaminhou para análise operacional`;

    updates.history = [
      ...removal.history,
      {
        date: new Date().toISOString(),
        action: actionText,
        user: user.name,
      },
    ];

    updateRemoval(removal.id, updates);
    onClose();
  };

  const handleConfirmWeightClick = () => {
    if (!realWeight || parseFloat(realWeight) <= 0) {
      alert('Por favor, informe um peso válido.');
      return;
    }
    setIsConfirmingWeight(true);
  };
  
  const resetFinalizationFlow = () => {
    setIsFinalizing(false);
    setRealWeight('');
    setIsConfirmingWeight(false);
    setStep('askObservation');
    setPetObservation('');
  };

  const handleStartFinalization = () => {
    setIsFinalizing(true);
    setStep('askObservation');
  };

  if (showNextActionModal && modalProps) {
    return (
        <NextActionModal
            currentRemoval={modalProps.currentRemoval}
            removals={modalProps.removals}
            onClose={onClose}
        />
    );
  }

  if (isFinalizing) {
    if (isConfirmingWeight) {
        let confirmationMessage = `Tem certeza que deseja confirmar o peso informado de ${realWeight} kg?`;
        if (petObservation.trim()) {
            confirmationMessage = `Tem certeza que deseja confirmar o peso informado de ${realWeight} kg e a informação descrita: "${petObservation.trim()}"?`;
        }
        return (
            <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-yellow-900 mb-3 text-center">
                    {confirmationMessage}
                </h4>
                <div className="flex gap-2">
                    <button onClick={() => setIsConfirmingWeight(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                    <button onClick={handleFinalize} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
                </div>
            </div>
        );
    }

    if (step === 'askObservation') {
        return (
            <div className="w-full p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3 text-center">O pet tem Observações a serem colocadas?</h4>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setStep('addObservation')} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">SIM</button>
                    <button onClick={() => setStep('addWeight')} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                </div>
                <button onClick={resetFinalizationFlow} className="w-full text-center mt-4 text-sm text-gray-500 hover:underline">Cancelar</button>
            </div>
        );
    }

    if (step === 'addObservation') {
        return (
            <div className="w-full p-4 bg-gray-50 rounded-lg border space-y-3">
                <h4 className="font-semibold text-gray-800">Observações do Pet</h4>
                <textarea
                    value={petObservation}
                    onChange={(e) => setPetObservation(e.target.value)}
                    placeholder="Ex: Tutor quer a coberta Vermelha que veio junto na remoção."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setStep('askObservation')} className="px-4 py-2 bg-gray-300 rounded-md text-sm">Voltar</button>
                    <button onClick={() => setStep('addWeight')} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">Salvar e Continuar</button>
                </div>
            </div>
        );
    }

    if (step === 'addWeight') {
        return (
            <div className="w-full p-4 bg-gray-50 rounded-lg border space-y-3">
                <h4 className="font-semibold text-gray-800">Informe o Peso Real</h4>
                {petObservation.trim() && (
                    <div className="p-2 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm">
                        <strong>Observação salva:</strong> {petObservation}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={realWeight}
                        onChange={(e) => setRealWeight(e.target.value)}
                        placeholder="Peso real (kg)"
                        className="px-3 py-2 border border-gray-300 rounded-md w-32"
                        autoFocus
                    />
                    <button onClick={handleConfirmWeightClick} className="px-4 py-2 bg-green-600 text-white rounded-md">Confirmar Peso</button>
                    <button onClick={() => setStep('askObservation')} className="px-4 py-2 bg-gray-300 rounded-md">Voltar</button>
                </div>
            </div>
        );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {removal.status === 'em_andamento' && (
        <button
          onClick={() => handleUpdateStatus('a_caminho', 'iniciou o deslocamento')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
        >
          <Truck size={16} /> Iniciar Deslocamento
        </button>
      )}
      {removal.status === 'a_caminho' && (
        <button
          onClick={() => handleUpdateStatus('removido', 'removeu o pet no endereço')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2"
        >
          <Check size={16} /> Confirmar Remoção
        </button>
      )}
      {removal.status === 'removido' && (
        <button
          onClick={handleStartFinalization}
          className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
        >
          <Scale size={16} /> Finalizar (Pesar Pet)
        </button>
      )}
    </div>
  );
};

export default MotoristaActions;
