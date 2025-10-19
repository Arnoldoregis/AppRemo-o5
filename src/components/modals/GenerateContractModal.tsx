import React from 'react';
import { Removal } from '../../types';
import { X, FileText } from 'lucide-react';

interface GenerateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  removalData: Partial<Removal> | null;
}

const GenerateContractModal: React.FC<GenerateContractModalProps> = ({ isOpen, onClose, onConfirm, removalData }) => {
  if (!isOpen || !removalData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-blue-500" />
            Confirmar e Gerar Contrato
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Você está prestes a finalizar a solicitação para o pet <strong>{removalData.pet?.name}</strong>.
          </p>
          <p className="text-gray-700">
            Ao clicar em "Gerar Contrato e Finalizar", um contrato em PDF será baixado e a sua solicitação será enviada para nossa equipe.
          </p>
        </div>
        <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Gerar Contrato e Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateContractModal;
