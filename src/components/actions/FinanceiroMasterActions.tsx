import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Download, Send, User } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';
import { mockFinanceiroJuniors } from '../../data/mock';

interface FinanceiroMasterActionsProps {
  removal: Removal;
  onClose: () => void;
}

const FinanceiroMasterActions: React.FC<FinanceiroMasterActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isConfirmingFinalization, setIsConfirmingFinalization] = useState(false);
  
  // States for 'encaminhado_master' status
  const [isDirectingToJunior, setIsDirectingToJunior] = useState(false);
  const [selectedJuniorId, setSelectedJuniorId] = useState('');
  const [isConfirmingColetivo, setIsConfirmingColetivo] = useState(false);

  // Handler for 'aguardando_baixa_master'
  const handleFinalize = () => {
    if (!user) return;
    updateRemoval(removal.id, {
      status: 'finalizada',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Ciclo finalizado pelo Financeiro Master`,
          user: user.name,
        },
      ],
    });
    onClose();
  };
  
  const handleDownloadProofs = () => {
    const downloadWithParsing = (proof: string) => {
        const parts = proof.split('||');
        if (parts.length === 2) {
            downloadFile(parts[0], parts[1]);
        } else {
            downloadFile(proof, proof);
        }
    };

    if (removal.paymentProof) {
      downloadWithParsing(removal.paymentProof);
    }
    removal.customAdditionals?.forEach(ad => {
      if (ad.paymentProof) {
        downloadWithParsing(ad.paymentProof);
      }
    });
  };

  // Handlers for 'encaminhado_master'
  const handleForwardToReceptor = () => {
    if (!user) return;
    updateRemoval(removal.id, {
        status: 'aguardando_venda_receptor',
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Encaminhado para Venda (Receptor) pelo Fin. Master ${user.name.split(' ')[0]}`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  const handleForwardToJunior = () => {
    if (!user || !selectedJuniorId) return;
    const selectedJunior = mockFinanceiroJuniors.find(j => j.id === selectedJuniorId);
    if (!selectedJunior) return;

    updateRemoval(removal.id, {
        status: 'aguardando_financeiro_junior',
        assignedFinanceiroJunior: { id: selectedJunior.id, name: selectedJunior.name },
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Direcionado para ${selectedJunior.name} pelo Fin. Master ${user.name.split(' ')[0]}`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  // Render logic for 'encaminhado_master'
  if (removal.status === 'encaminhado_master') {
    if (removal.modality === 'coletivo') {
        if (isConfirmingColetivo) {
            return (
                <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <h4 className="font-semibold text-yellow-900 mb-3 text-center">
                        Encaminhar esta remoção para a aba "Liberado para Venda" do Receptor?
                    </h4>
                    <div className="flex gap-2">
                        <button onClick={() => setIsConfirmingColetivo(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                        <button onClick={handleForwardToReceptor} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
                    </div>
                </div>
            );
        }
        return (
            <button
                onClick={() => setIsConfirmingColetivo(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
                <Send size={16} /> Encaminhar p/ Venda (Receptor)
            </button>
        );
    }

    if (removal.modality.includes('individual')) {
        if (isDirectingToJunior) {
            return (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedJuniorId}
                        onChange={(e) => setSelectedJuniorId(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione um Financeiro Jr.</option>
                        {mockFinanceiroJuniors.map(junior => (
                            <option key={junior.id} value={junior.id}>{junior.name}</option>
                        ))}
                    </select>
                    <button onClick={handleForwardToJunior} disabled={!selectedJuniorId} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">Confirmar</button>
                    <button onClick={() => setIsDirectingToJunior(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Voltar</button>
                </div>
            );
        }
        return (
            <button
                onClick={() => setIsDirectingToJunior(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
                <User size={16} /> Direcionar p/ Fin. Junior
            </button>
        );
    }
  }

  // Render logic for 'aguardando_baixa_master' (non-faturado)
  if (removal.status === 'aguardando_baixa_master' && removal.paymentMethod !== 'faturado') {
      const hasProofs = removal.paymentProof || removal.customAdditionals?.some(ad => ad.paymentProof);

      if (isConfirmingFinalization) {
        return (
          <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
            <h4 className="font-semibold text-yellow-900 mb-3 text-center">
              Tem certeza de que quer finalizar a remoção?
            </h4>
            <div className="flex gap-2">
              <button onClick={() => setIsConfirmingFinalization(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
              <button onClick={handleFinalize} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          {hasProofs && (
            <button onClick={handleDownloadProofs} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Download size={16} /> Baixar Comprovantes
            </button>
          )}
          <button onClick={() => setIsConfirmingFinalization(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
            <CheckCircle size={16} /> Finalizar Ciclo
          </button>
        </div>
      );
  }

  return null;
};

export default FinanceiroMasterActions;
